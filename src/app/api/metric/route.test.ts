import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getMetricCount, resetInMemoryStore } from "@/lib/redis";
import { POST } from "./route";

function makeMetricRequest(body: unknown, ip = "203.0.113.50"): Request {
  return new Request("http://localhost:3000/api/metric", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/metric", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetInMemoryStore();
    process.env = {
      ...originalEnv,
      IP_HASH_SALT: "metric-salt",
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("menolak event di luar daftar putih dan payload tidak valid dengan 400", async () => {
    const resInvalidEvent = await POST(
      makeMetricRequest({ event: "arbitrary_event" })
    );
    expect(resInvalidEvent.status).toBe(400);

    const resMissingEvent = await POST(makeMetricRequest({}));
    expect(resMissingEvent.status).toBe(400);

    const resBadJson = await POST(makeMetricRequest("{not-json"));
    expect(resBadJson.status).toBe(400);
  });

  it("menerima seluruh event whitelist dan menaikkan counter", async () => {
    for (const event of [
      "sesi_selesai",
      "klik_paywall",
      "klik_wa",
      "klik_fd_tabel",
      "klik_fd_simulator",
      "klik_fd_ai",
    ] as const) {
      const res = await POST(makeMetricRequest({ event }));
      expect(res.status).toBe(200);
      const data = (await res.json()) as { ok: boolean; event: string };
      expect(data).toEqual({ ok: true, event });
      expect(await getMetricCount(event)).toBe(1);
    }

    const resAgain = await POST(makeMetricRequest({ event: "klik_paywall" }));
    expect(resAgain.status).toBe(200);
    expect(await getMetricCount("klik_paywall")).toBe(2);
  });

  it("menerapkan rate limit per IP-hash dan mengembalikan 429 saat spam", async () => {
    const spamIp = "198.51.100.99";

    for (let i = 0; i < 30; i++) {
      const res = await POST(
        makeMetricRequest({ event: "sesi_selesai" }, spamIp)
      );
      expect(res.status).toBe(200);
    }

    const blocked = await POST(
      makeMetricRequest({ event: "sesi_selesai" }, spamIp)
    );
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });
});
