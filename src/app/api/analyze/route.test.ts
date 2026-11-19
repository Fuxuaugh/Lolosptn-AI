import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_CONFIG } from "@/config/app.config";
import { getCodeUsage, resetInMemoryStore } from "@/lib/redis";
import { POST, type AnalyzeResponseBody } from "./route";

const INFORMATIKA_UPNVJT = "13851006";
const SISTEM_INFORMASI_UPNVJT = "13851007";

function makeRequest(
  body: unknown,
  ip = "203.0.113.10"
): Request {
  return new Request("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function validSnbtBody(overrides: Record<string, unknown> = {}) {
  return {
    jalur: "snbt",
    accessCode: "COBALOLOS",
    pilihan1Kode: INFORMATIKA_UPNVJT,
    pilihan2Kode: SISTEM_INFORMASI_UPNVJT,
    snbtInput: { mode: "average", averageScore: 630 },
    ...overrides,
  };
}

function validSnbpBody(overrides: Record<string, unknown> = {}) {
  return {
    jalur: "snbp",
    accessCode: "COBALOLOS",
    pilihan1Kode: INFORMATIKA_UPNVJT,
    pilihan2Kode: SISTEM_INFORMASI_UPNVJT,
    snbpProfile: {
      raporAverage: 89.5,
      mapelPendukungAverage: 90,
      akreditasi: "A",
      prestasi: "provinsi",
    },
    pilihan1HasAlumni: true,
    pilihan2HasAlumni: false,
    ...overrides,
  };
}

function mockGeminiSuccess(text: string) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({
        candidates: [{ content: { parts: [{ text }] } }],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  );
}

describe("POST /api/analyze", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetInMemoryStore();
    vi.restoreAllMocks();
    process.env = {
      ...originalEnv,
      ACCESS_CODES: "COBALOLOS, BATCH2 ",
      ACCESS_CODE_MAX_USES: "50",
      GEMINI_API_KEY: "test-gemini-key",
      GEMINI_MODEL: "gemini-2.5-flash",
      IP_HASH_SALT: "test-salt",
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("mengembalikan 401 jika kode akses salah atau kosong", async () => {
    const resWrong = await POST(
      makeRequest(validSnbtBody({ accessCode: "SALAH123" }))
    );
    expect(resWrong.status).toBe(401);

    const resEmpty = await POST(
      makeRequest(validSnbtBody({ accessCode: "   " }))
    );
    expect(resEmpty.status).toBe(401);
  });

  it("mengembalikan 400 jika payload tidak valid", async () => {
    const resInvalidJson = await POST(makeRequest("{broken-json"));
    expect(resInvalidJson.status).toBe(400);

    const resInvalidScore = await POST(
      makeRequest(
        validSnbtBody({ snbtInput: { mode: "average", averageScore: 1500 } })
      )
    );
    expect(resInvalidScore.status).toBe(400);

    const resSameProdi = await POST(
      makeRequest(
        validSnbtBody({
          pilihan1Kode: INFORMATIKA_UPNVJT,
          pilihan2Kode: INFORMATIKA_UPNVJT,
        })
      )
    );
    expect(resSameProdi.status).toBe(400);
  });

  it("mengembalikan 200 pada kode akses valid + Gemini sukses, kuota bertambah 1, F5 terisi, tanpa PII", async () => {
    const aiText =
      "Paragraf 1 evaluasi posisi.\n\nParagraf 2 strategi urutan dan alternatif.\n\nParagraf 3 target kenaikan realistis.";
    const fetchSpy = mockGeminiSuccess(aiText);

    const res = await POST(makeRequest(validSnbtBody()));
    expect(res.status).toBe(200);

    const data = (await res.json()) as AnalyzeResponseBody;
    expect(data.cached).toBe(false);
    expect(data.isFallback).toBe(false);
    expect(data.analysis).toBe(aiText);
    expect(data.alternatives.length).toBeGreaterThan(0);
    expect(data.alternatives.length).toBeLessThanOrEqual(
      APP_CONFIG.recommender.maxAlternatives
    );
    expect(await getCodeUsage("COBALOLOS")).toBe(1);

    // Verifikasi pemanggilan Gemini menggunakan model dari env & tidak membocorkan accessCode
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, init] = fetchSpy.mock.calls[0];
    expect(String(calledUrl)).toContain("gemini-2.5-flash:generateContent");
    const sentBody = String(init?.body ?? "");
    expect(sentBody).not.toContain("COBALOLOS");
    expect(sentBody).not.toContain("203.0.113.10");
  });

  it("mendukung jalur SNBP termasuk status alumni terpisah per pilihan", async () => {
    const fetchSpy = mockGeminiSuccess("Analisis SNBP sukses.");

    const res = await POST(makeRequest(validSnbpBody()));
    expect(res.status).toBe(200);
    const data = (await res.json()) as AnalyzeResponseBody;
    expect(data.isFallback).toBe(false);
    expect(data.cached).toBe(false);
    expect(data.alternatives.length).toBeGreaterThan(0);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(await getCodeUsage("COBALOLOS")).toBe(1);
  });

  it("mengembalikan cached: true pada permintaan kedua dengan input sama TANPA menambah kuota kode", async () => {
    const fetchSpy = mockGeminiSuccess("Analisis strategi cached.");

    const first = await POST(makeRequest(validSnbtBody(), "198.51.100.1"));
    expect(first.status).toBe(200);
    expect(await getCodeUsage("COBALOLOS")).toBe(1);

    // Permintaan kedua (input sama, termasuk pembulatan 630.2 -> 630)
    const second = await POST(
      makeRequest(
        validSnbtBody({ snbtInput: { mode: "average", averageScore: 630.2 } }),
        "198.51.100.2"
      )
    );
    expect(second.status).toBe(200);
    const data2 = (await second.json()) as AnalyzeResponseBody;
    expect(data2.cached).toBe(true);
    expect(data2.isFallback).toBe(false);
    expect(data2.analysis).toBe("Analisis strategi cached.");

    // Kuota kode TIDAK bertambah dan Gemini TIDAK dipanggil ulang
    expect(await getCodeUsage("COBALOLOS")).toBe(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("mengembalikan 403 saat kuota kode sudah mencapai batas pada cache miss", async () => {
    process.env.ACCESS_CODE_MAX_USES = "1";
    mockGeminiSuccess("Analisis pertama.");

    // Pemakaian ke-1 berhasil -> kuota terpakai 1/1
    const first = await POST(makeRequest(validSnbtBody(), "198.51.100.10"));
    expect(first.status).toBe(200);
    expect(await getCodeUsage("COBALOLOS")).toBe(1);

    // Input berbeda (cache miss) -> ditolak 403 karena kuota habis
    const second = await POST(
      makeRequest(
        validSnbtBody({ snbtInput: { mode: "average", averageScore: 650 } }),
        "198.51.100.11"
      )
    );
    expect(second.status).toBe(403);
    expect(await getCodeUsage("COBALOLOS")).toBe(1);
  });

  it("mengembalikan 429 saat rate limit per IP-hash terlampaui", async () => {
    mockGeminiSuccess("Analisis.");
    const sameIp = "198.51.100.77";

    for (let i = 0; i < APP_CONFIG.rateLimit.maxRequests; i++) {
      const res = await POST(makeRequest(validSnbtBody(), sameIp));
      expect(res.status).toBe(200);
    }

    const blocked = await POST(makeRequest(validSnbtBody(), sameIp));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });

  it("memakai fallback.ts saat Gemini gagal (HTTP 500), F5 tetap ada, tidak di-cache, dan kuota kode tidak bertambah", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("Upstream error", { status: 500 }));

    const res1 = await POST(makeRequest(validSnbtBody(), "198.51.100.20"));
    expect(res1.status).toBe(200);

    const data1 = (await res1.json()) as AnalyzeResponseBody;
    expect(data1.isFallback).toBe(true);
    expect(data1.cached).toBe(false);
    expect(data1.alternatives.length).toBeGreaterThan(0);
    expect(data1.analysis.split("\n\n").length).toBeLessThanOrEqual(3);
    expect(await getCodeUsage("COBALOLOS")).toBe(0);

    // Karena fallback TIDAK di-cache, request kedua dengan input sama memanggil Gemini lagi
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "Gemini pulih." }] } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const res2 = await POST(makeRequest(validSnbtBody(), "198.51.100.21"));
    expect(res2.status).toBe(200);
    const data2 = (await res2.json()) as AnalyzeResponseBody;
    expect(data2.isFallback).toBe(false);
    expect(data2.cached).toBe(false);
    expect(data2.analysis).toBe("Gemini pulih.");
    expect(await getCodeUsage("COBALOLOS")).toBe(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("memakai fallback.ts saat Gemini timeout/network error atau GEMINI_API_KEY kosong tanpa mengurangi kuota", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new DOMException("The operation was aborted.", "AbortError")
    );

    const resTimeout = await POST(makeRequest(validSnbtBody(), "198.51.100.30"));
    expect(resTimeout.status).toBe(200);
    const dataTimeout = (await resTimeout.json()) as AnalyzeResponseBody;
    expect(dataTimeout.isFallback).toBe(true);
    expect(dataTimeout.alternatives.length).toBeGreaterThan(0);
    expect(await getCodeUsage("COBALOLOS")).toBe(0);

    // Kasus GEMINI_API_KEY kosong
    process.env.GEMINI_API_KEY = "";
    const resNoKey = await POST(makeRequest(validSnbtBody(), "198.51.100.31"));
    expect(resNoKey.status).toBe(200);
    const dataNoKey = (await resNoKey.json()) as AnalyzeResponseBody;
    expect(dataNoKey.isFallback).toBe(true);
    expect(await getCodeUsage("COBALOLOS")).toBe(0);
  });
});
