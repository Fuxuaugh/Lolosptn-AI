/**
 * POST /api/metric — Counter metrik anonim (daftar putih event).
 * Hanya menerima `sesi_selesai`, `klik_paywall`, dan `klik_wa`.
 * Dilindungi rate limit per IP-hash (TTL <= 1 jam), tanpa PII.
 */

import { NextResponse } from "next/server";
import { APP_CONFIG } from "@/config/app.config";
import {
  ALLOWED_METRIC_EVENTS,
  checkRateLimit,
  extractClientIp,
  hashIp,
  incrementMetric,
  type MetricEvent,
} from "@/lib/redis";

const METRIC_EVENT_SET = new Set<string>(ALLOWED_METRIC_EVENTS);
const METRIC_RATE_LIMIT_MAX = 30;

function isAllowedEvent(value: unknown): value is MetricEvent {
  return typeof value === "string" && METRIC_EVENT_SET.has(value);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body request harus berupa JSON yang valid." },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Body request harus berupa objek JSON." },
      { status: 400 }
    );
  }

  const event = (body as Record<string, unknown>).event;
  if (!isAllowedEvent(event)) {
    return NextResponse.json(
      { error: "Event metrik tidak valid." },
      { status: 400 }
    );
  }

  const ipHash = hashIp(extractClientIp(request));
  const rateLimit = await checkRateLimit(ipHash, {
    scope: "metric",
    maxRequests: METRIC_RATE_LIMIT_MAX,
    windowSeconds: APP_CONFIG.rateLimit.windowSeconds,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan metrik." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.resetInSeconds) },
      }
    );
  }

  await incrementMetric(event);
  return NextResponse.json({ ok: true, event }, { status: 200 });
}
