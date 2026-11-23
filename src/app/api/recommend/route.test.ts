import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { APP_CONFIG } from "@/config/app.config";
import { resetInMemoryStore } from "@/lib/redis";
import { POST, type RecommendResponseBody } from "./route";

const INFORMATIKA_UPNVJT = "13851006";

function makeRequest(body: unknown, ip = "203.0.113.77"): Request {
  return new Request("http://localhost:3000/api/recommend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/recommend", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetInMemoryStore();
    process.env = {
      ...originalEnv,
      IP_HASH_SALT: "recommend-salt",
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("menolak payload tidak valid dengan 400", async () => {
    const resBadJson = await POST(makeRequest("{invalid"));
    expect(resBadJson.status).toBe(400);

    const resMissingJalur = await POST(makeRequest({ pilihan1Kode: INFORMATIKA_UPNVJT }));
    expect(resMissingJalur.status).toBe(400);

    const resOutOfRange = await POST(
      makeRequest({
        jalur: "snbt",
        pilihan1Kode: INFORMATIKA_UPNVJT,
        snbtInput: { mode: "average", averageScore: 1500 },
      })
    );
    expect(resOutOfRange.status).toBe(400);
  });

  it("mengembalikan maksimal 3 alternatif dan ringkasan otomatis untuk SNBT tanpa kode akses", async () => {
    const res = await POST(
      makeRequest({
        jalur: "snbt",
        pilihan1Kode: INFORMATIKA_UPNVJT,
        snbtInput: { mode: "average", averageScore: 630 },
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as RecommendResponseBody;
    expect(data.alternatives.length).toBeGreaterThan(0);
    expect(data.alternatives.length).toBeLessThanOrEqual(
      APP_CONFIG.recommender.maxAlternatives
    );
    expect(data.summary).toContain("SNBT");
    expect(data.summary.split("\n\n")).toHaveLength(3);
  });

  it("mengembalikan ringkasan SNBP tanpa menyarankan menaikkan rapor", async () => {
    const res = await POST(
      makeRequest({
        jalur: "snbp",
        pilihan1Kode: INFORMATIKA_UPNVJT,
        snbpProfile: {
          raporAverage: 88,
          mapelPendukungAverage: 89,
          akreditasi: "A",
          prestasi: "tidak_ada",
        },
        pilihan1HasAlumni: true,
        pilihan2HasAlumni: false,
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as RecommendResponseBody;
    expect(data.summary).toContain("rapor semester 1–5 sudah tetap");
    expect(data.summary).toContain("TKA");
    expect(data.summary).toContain("belum terkalibrasi");
  });

  it("menerapkan rate limit per IP-hash dan mengembalikan 429 saat spam", async () => {
    const spamIp = "198.51.100.88";
    const body = {
      jalur: "snbt",
      pilihan1Kode: INFORMATIKA_UPNVJT,
      snbtInput: { mode: "average", averageScore: 610 },
    };

    for (let i = 0; i < APP_CONFIG.rateLimit.recommendMaxRequests; i++) {
      const res = await POST(makeRequest(body, spamIp));
      expect(res.status).toBe(200);
    }

    const blocked = await POST(makeRequest(body, spamIp));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });
});
