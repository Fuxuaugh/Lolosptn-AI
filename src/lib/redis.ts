/**
 * Klien penyimpanan state produksi berbasis Upstash Redis REST API
 * dengan fallback Map in-memory (dengan TTL) khusus dev lokal / testing.
 *
 * Zero koneksi TCP — aman untuk Vercel Serverless Functions.
 * IP pengguna tidak pernah disimpan mentah; hanya sha256(ip + IP_HASH_SALT)
 * dengan TTL maksimal 1 jam (3600 detik).
 */

import { createHash } from "node:crypto";
import { APP_CONFIG, type MetricEvent } from "@/config/app.config";

export const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 jam
export const MAX_RATE_LIMIT_TTL_SECONDS = 60 * 60; // <= 1 jam (aturan privasi PRD)

export const ALLOWED_METRIC_EVENTS: readonly MetricEvent[] = [
  "sesi_selesai",
  "klik_paywall",
  "klik_wa",
] as const;

export type { MetricEvent };

export interface RateLimitOptions {
  scope?: string;
  maxRequests?: number;
  windowSeconds?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  remaining: number;
  resetInSeconds: number;
}

interface MemoryEntry {
  value: string;
  /** Timestamp ms saat entri kedaluwarsa; null berarti tanpa TTL */
  expiresAt: number | null;
}

// ---------------------------------------------------------------------------
// In-memory store fallback (bertahan antar HMR di dev lokal)
// ---------------------------------------------------------------------------

const globalForRedis = globalThis as typeof globalThis & {
  __lolosptnMemoryStore?: Map<string, MemoryEntry>;
};

function getMemoryStore(): Map<string, MemoryEntry> {
  if (!globalForRedis.__lolosptnMemoryStore) {
    globalForRedis.__lolosptnMemoryStore = new Map<string, MemoryEntry>();
  }
  return globalForRedis.__lolosptnMemoryStore;
}

function getFreshMemoryEntry(key: string): MemoryEntry | null {
  const store = getMemoryStore();
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt !== null && Date.now() >= entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry;
}

/** Menghapus seluruh state in-memory (khusus isolasi unit test). */
export function resetInMemoryStore(): void {
  getMemoryStore().clear();
}

// ---------------------------------------------------------------------------
// Konfigurasi & REST runner Upstash
// ---------------------------------------------------------------------------

interface UpstashConfig {
  url: string;
  token: string;
}

function getUpstashConfig(): UpstashConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

export function isUpstashConfigured(): boolean {
  return getUpstashConfig() !== null;
}

type RedisCommandArg = string | number;

async function upstashCommand(
  config: UpstashConfig,
  command: RedisCommandArg[]
): Promise<unknown> {
  const res = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!res.ok) {
    throw new Error(`Upstash REST error: HTTP ${res.status}`);
  }

  const data = (await res.json()) as { result?: unknown; error?: string };
  if (data.error) {
    throw new Error(`Upstash command error: ${data.error}`);
  }
  return data.result;
}

async function upstashPipeline(
  config: UpstashConfig,
  commands: RedisCommandArg[][]
): Promise<unknown[]> {
  const res = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });

  if (!res.ok) {
    throw new Error(`Upstash pipeline error: HTTP ${res.status}`);
  }

  const items = (await res.json()) as Array<{
    result?: unknown;
    error?: string;
  }>;
  return items.map((item) => {
    if (item.error) {
      throw new Error(`Upstash pipeline command error: ${item.error}`);
    }
    return item.result;
  });
}

// ---------------------------------------------------------------------------
// Privasi IP: hashing satu arah
// ---------------------------------------------------------------------------

export function extractClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "127.0.0.1";
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "";
  return createHash("sha256").update(`${ip}${salt}`).digest("hex");
}

// ---------------------------------------------------------------------------
// Helper Cache (TTL default 24 jam)
// ---------------------------------------------------------------------------

export async function getCache<T>(key: string): Promise<T | null> {
  const config = getUpstashConfig();
  let raw: string | null = null;

  if (config) {
    const result = await upstashCommand(config, ["GET", key]);
    raw = typeof result === "string" ? result : null;
  } else {
    const entry = getFreshMemoryEntry(key);
    raw = entry ? entry.value : null;
  }

  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = CACHE_TTL_SECONDS
): Promise<void> {
  const serialized = JSON.stringify(value);
  const safeTtl = Math.max(1, Math.floor(ttlSeconds));
  const config = getUpstashConfig();

  if (config) {
    await upstashCommand(config, ["SET", key, serialized, "EX", safeTtl]);
    return;
  }

  getMemoryStore().set(key, {
    value: serialized,
    expiresAt: Date.now() + safeTtl * 1000,
  });
}

// ---------------------------------------------------------------------------
// Helper Rate Limit per IP-hash (TTL wajib <= 1 jam)
// ---------------------------------------------------------------------------

export async function checkRateLimit(
  ipHash: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const scope = options.scope ?? "analyze";
  const maxRequests = options.maxRequests ?? APP_CONFIG.rateLimit.maxRequests;
  const requestedWindow =
    options.windowSeconds ?? APP_CONFIG.rateLimit.windowSeconds;
  const windowSeconds = Math.max(
    1,
    Math.min(Math.floor(requestedWindow), MAX_RATE_LIMIT_TTL_SECONDS)
  );
  const key = `lolosptn:rl:${scope}:${ipHash}`;

  const config = getUpstashConfig();
  if (config) {
    const [rawCount, rawTtl] = await upstashPipeline(config, [
      ["INCR", key],
      ["TTL", key],
    ]);
    const count = Number(rawCount) || 1;
    let ttl = Number(rawTtl);

    if (count === 1 || !Number.isFinite(ttl) || ttl < 0) {
      await upstashCommand(config, ["EXPIRE", key, windowSeconds]);
      ttl = windowSeconds;
    }

    return {
      allowed: count <= maxRequests,
      count,
      remaining: Math.max(0, maxRequests - count),
      resetInSeconds: Math.max(1, Math.ceil(ttl)),
    };
  }

  const store = getMemoryStore();
  const now = Date.now();
  const existing = getFreshMemoryEntry(key);

  if (!existing) {
    store.set(key, {
      value: "1",
      expiresAt: now + windowSeconds * 1000,
    });
    return {
      allowed: 1 <= maxRequests,
      count: 1,
      remaining: Math.max(0, maxRequests - 1),
      resetInSeconds: windowSeconds,
    };
  }

  const nextCount = (Number(existing.value) || 0) + 1;
  const expiresAt = existing.expiresAt ?? now + windowSeconds * 1000;
  store.set(key, { value: String(nextCount), expiresAt });

  return {
    allowed: nextCount <= maxRequests,
    count: nextCount,
    remaining: Math.max(0, maxRequests - nextCount),
    resetInSeconds: Math.max(1, Math.ceil((expiresAt - now) / 1000)),
  };
}

// ---------------------------------------------------------------------------
// Helper Kuota Kode Akses
// ---------------------------------------------------------------------------

function codeUsageKey(code: string): string {
  return `lolosptn:code_usage:${code.trim()}`;
}

export async function getCodeUsage(code: string): Promise<number> {
  const key = codeUsageKey(code);
  const config = getUpstashConfig();

  if (config) {
    const result = await upstashCommand(config, ["GET", key]);
    return Number(result) || 0;
  }

  const entry = getFreshMemoryEntry(key);
  return entry ? Number(entry.value) || 0 : 0;
}

export async function incrementCodeUsage(code: string): Promise<number> {
  const key = codeUsageKey(code);
  const config = getUpstashConfig();

  if (config) {
    const result = await upstashCommand(config, ["INCR", key]);
    return Number(result) || 1;
  }

  const store = getMemoryStore();
  const existing = getFreshMemoryEntry(key);
  const next = (existing ? Number(existing.value) || 0 : 0) + 1;
  store.set(key, { value: String(next), expiresAt: null });
  return next;
}

// ---------------------------------------------------------------------------
// Helper Counter Metrik Anonim (INCR)
// ---------------------------------------------------------------------------

function metricKey(event: MetricEvent): string {
  return `lolosptn:metric:${event}`;
}

export async function incrementMetric(event: MetricEvent): Promise<number> {
  const key = metricKey(event);
  const config = getUpstashConfig();

  if (config) {
    const result = await upstashCommand(config, ["INCR", key]);
    return Number(result) || 1;
  }

  const store = getMemoryStore();
  const existing = getFreshMemoryEntry(key);
  const next = (existing ? Number(existing.value) || 0 : 0) + 1;
  store.set(key, { value: String(next), expiresAt: null });
  return next;
}

export async function getMetricCount(event: MetricEvent): Promise<number> {
  const key = metricKey(event);
  const config = getUpstashConfig();

  if (config) {
    const result = await upstashCommand(config, ["GET", key]);
    return Number(result) || 0;
  }

  const entry = getFreshMemoryEntry(key);
  return entry ? Number(entry.value) || 0 : 0;
}
