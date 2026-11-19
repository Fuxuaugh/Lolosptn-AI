/**
 * POST /api/analyze — Server-side Paywall, F5 Recommender, & F6 Gemini AI Advisor.
 *
 * Urutan pemrosesan ketat (PRD Bagian 5 F4):
 *   1. Parse JSON & validasi kode akses terhadap `ACCESS_CODES` (401 jika salah/kosong).
 *   2. Validasi seluruh body input (400 jika tidak valid).
 *   3. Cek rate limit per IP-hash sha256(ip + IP_HASH_SALT) (429 jika terlampaui).
 *   4. Cek cache (kunci = input dibulatkan + dataset_version + GEMINI_MODEL).
 *      Cache hit -> kembalikan hasil TANPA mengurangi kuota kode akses.
 *   5. Cache miss -> cek kuota kode < ACCESS_CODE_MAX_USES (403 jika habis).
 *   6. Hitung F2 & F5 (dari static import `data/index.json`) lalu panggil Gemini API
 *      dengan payload anonim (zero PII) & timeout 12 detik.
 *   7. Gemini berhasil -> simpan cache (24 jam), naikkan pemakaian kode, return 200 (isFallback: false).
 *      Gemini gagal/timeout/key kosong -> pakai `fallback.ts`, JANGAN cache,
 *      JANGAN kurangi kuota kode, return 200 (isFallback: true) dengan F5 tetap utuh.
 */

import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  APP_CONFIG,
  type Akreditasi,
  type Jalur,
  type PrestasiLevel,
} from "@/config/app.config";
import {
  DATASET_VERSION,
  findProdiByKode,
  type ProdiIndexItem,
} from "@/lib/dataset";
import {
  generateFallbackAnalysis,
  type ChoicePredictionSummary,
} from "@/lib/fallback";
import {
  calculateSnbtUserScore,
  predictSnbp,
  predictSnbt,
  recommendAlternatives,
  toSnbpTarget,
  toSnbtTarget,
  type AlternativeRecommendation,
  type PredictionResult,
  type SnbpProfileInput,
  type SnbtScoreInput,
} from "@/lib/prediction";
import {
  CACHE_TTL_SECONDS,
  checkRateLimit,
  extractClientIp,
  getCache,
  getCodeUsage,
  hashIp,
  incrementCodeUsage,
  setCache,
} from "@/lib/redis";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_MAX_CODE_USES = 50;
const GEMINI_TIMEOUT_MS = 12_000;

const VALID_AKREDITASI = new Set<string>(["A", "B", "C"]);
const VALID_PRESTASI = new Set<string>([
  "nasional",
  "provinsi",
  "kabupaten",
  "tidak_ada",
]);

const SYSTEM_PROMPT = [
  "Kamu adalah penasihat strategi seleksi masuk PTN Indonesia (SNBP & SNBT) untuk LolosPTN.AI.",
  "Gunakan Bahasa Indonesia yang jelas, objektif, suportif, dan praktis.",
  "ATURAN WAJIB:",
  "1. DILARANG mengubah, membulatkan secara keliru, atau mengarang angka apa pun. Gunakan HANYA angka dari payload JSON yang diberikan.",
  "2. Maksimal 3 paragraf pendek (total sekitar 250–300 kata), tanpa daftar panjang atau tabel markdown.",
  "3. Paragraf 1: evaluasi posisi Pilihan 1 dan Pilihan 2 (jika ada) berdasarkan probabilitas, rentang sensitivitas, dan status.",
  "4. Paragraf 2: saran urutan pilihan dan pemanfaatan maksimal 3 alternatif prodi F5 yang tersedia.",
  "5. Paragraf 3: target kenaikan skor/nilai yang realistis serta langkah fokus persiapan.",
  "6. Ingatkan secara singkat bahwa angka adalah estimasi statistik, bukan passing grade resmi SNPMB.",
].join("\n");

// ---------------------------------------------------------------------------
// Tipe Validated Request & Response
// ---------------------------------------------------------------------------

type ValidatedAnalyzePayload =
  | {
      jalur: "snbt";
      pilihan1: ProdiIndexItem;
      pilihan2: ProdiIndexItem | null;
      snbtInput: SnbtScoreInput;
    }
  | {
      jalur: "snbp";
      pilihan1: ProdiIndexItem;
      pilihan2: ProdiIndexItem | null;
      snbpProfile: Omit<SnbpProfileInput, "hasAlumni">;
      pilihan1HasAlumni: boolean;
      pilihan2HasAlumni: boolean;
    };

interface CachedAnalyzeResult {
  alternatives: AlternativeRecommendation[];
  analysis: string;
}

export interface AnalyzeResponseBody {
  alternatives: AlternativeRecommendation[];
  analysis: string;
  cached: boolean;
  isFallback: boolean;
}

// ---------------------------------------------------------------------------
// Helpers Validasi & Keamanan
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sha256Buffer(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function verifyAccessCode(provided: unknown): string | null {
  if (typeof provided !== "string") return null;
  const trimmed = provided.trim();
  if (!trimmed) return null;

  const configured = (process.env.ACCESS_CODES ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);

  if (configured.length === 0) return null;

  const providedHash = sha256Buffer(trimmed);
  for (const validCode of configured) {
    const validHash = sha256Buffer(validCode);
    if (timingSafeEqual(providedHash, validHash)) {
      return validCode;
    }
  }

  return null;
}

function parseMaxCodeUses(): number {
  const raw = Number(process.env.ACCESS_CODE_MAX_USES);
  if (Number.isInteger(raw) && raw > 0) return raw;
  return DEFAULT_MAX_CODE_USES;
}

function isFiniteInRange(value: unknown, min: number, max: number): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}

function validatePayload(
  body: Record<string, unknown>
): { ok: true; data: ValidatedAnalyzePayload } | { ok: false; error: string } {
  const jalur = body.jalur;
  if (jalur !== "snbt" && jalur !== "snbp") {
    return { ok: false, error: "Field 'jalur' harus 'snbt' atau 'snbp'." };
  }

  const pilihan1Kode =
    typeof body.pilihan1Kode === "string" ? body.pilihan1Kode.trim() : "";
  if (!pilihan1Kode) {
    return { ok: false, error: "Field 'pilihan1Kode' wajib diisi." };
  }

  const pilihan1 = findProdiByKode(pilihan1Kode);
  if (!pilihan1 || !pilihan1[jalur].tersedia) {
    return {
      ok: false,
      error: "Pilihan 1 tidak ditemukan atau tidak tersedia pada jalur terpilih.",
    };
  }

  let pilihan2: ProdiIndexItem | null = null;
  if (body.pilihan2Kode !== undefined && body.pilihan2Kode !== null && body.pilihan2Kode !== "") {
    if (typeof body.pilihan2Kode !== "string") {
      return { ok: false, error: "Field 'pilihan2Kode' harus berupa string." };
    }
    const kode2 = body.pilihan2Kode.trim();
    if (kode2 === pilihan1Kode) {
      return {
        ok: false,
        error: "Pilihan 1 dan Pilihan 2 tidak boleh sama.",
      };
    }
    const found2 = findProdiByKode(kode2);
    if (!found2 || !found2[jalur].tersedia) {
      return {
        ok: false,
        error: "Pilihan 2 tidak ditemukan atau tidak tersedia pada jalur terpilih.",
      };
    }
    pilihan2 = found2;
  }

  if (jalur === "snbt") {
    const { min, max, subtestCount } = APP_CONFIG.inputBounds.snbt;
    const rawSnbt = body.snbtInput;
    if (!isRecord(rawSnbt)) {
      return { ok: false, error: "Field 'snbtInput' wajib diisi untuk jalur SNBT." };
    }

    if (rawSnbt.mode === "average") {
      if (!isFiniteInRange(rawSnbt.averageScore, min, max)) {
        return {
          ok: false,
          error: `Field 'averageScore' harus angka antara ${min} dan ${max}.`,
        };
      }
      return {
        ok: true,
        data: {
          jalur: "snbt",
          pilihan1,
          pilihan2,
          snbtInput: { mode: "average", averageScore: rawSnbt.averageScore },
        },
      };
    }

    if (rawSnbt.mode === "subtests") {
      if (
        !Array.isArray(rawSnbt.subtests) ||
        rawSnbt.subtests.length !== subtestCount ||
        !rawSnbt.subtests.every((n) => isFiniteInRange(n, min, max))
      ) {
        return {
          ok: false,
          error: `Field 'subtests' harus array berisi ${subtestCount} angka antara ${min} dan ${max}.`,
        };
      }
      return {
        ok: true,
        data: {
          jalur: "snbt",
          pilihan1,
          pilihan2,
          snbtInput: { mode: "subtests", subtests: rawSnbt.subtests as number[] },
        },
      };
    }

    return {
      ok: false,
      error: "Field 'snbtInput.mode' harus 'average' atau 'subtests'.",
    };
  }

  // Validasi SNBP
  const { min, max } = APP_CONFIG.inputBounds.snbp;
  const rawProfile = body.snbpProfile;
  if (!isRecord(rawProfile)) {
    return {
      ok: false,
      error: "Field 'snbpProfile' wajib diisi untuk jalur SNBP.",
    };
  }

  if (!isFiniteInRange(rawProfile.raporAverage, min, max)) {
    return {
      ok: false,
      error: `Field 'raporAverage' harus angka antara ${min} dan ${max}.`,
    };
  }

  if (!isFiniteInRange(rawProfile.mapelPendukungAverage, min, max)) {
    return {
      ok: false,
      error: `Field 'mapelPendukungAverage' harus angka antara ${min} dan ${max}.`,
    };
  }

  if (
    typeof rawProfile.akreditasi !== "string" ||
    !VALID_AKREDITASI.has(rawProfile.akreditasi)
  ) {
    return { ok: false, error: "Field 'akreditasi' harus 'A', 'B', atau 'C'." };
  }

  if (
    typeof rawProfile.prestasi !== "string" ||
    !VALID_PRESTASI.has(rawProfile.prestasi)
  ) {
    return {
      ok: false,
      error:
        "Field 'prestasi' harus 'nasional', 'provinsi', 'kabupaten', atau 'tidak_ada'.",
    };
  }

  if (typeof body.pilihan1HasAlumni !== "boolean") {
    return {
      ok: false,
      error: "Field 'pilihan1HasAlumni' wajib berupa boolean.",
    };
  }

  if (
    pilihan2 !== null &&
    body.pilihan2HasAlumni !== undefined &&
    typeof body.pilihan2HasAlumni !== "boolean"
  ) {
    return {
      ok: false,
      error: "Field 'pilihan2HasAlumni' harus berupa boolean.",
    };
  }

  return {
    ok: true,
    data: {
      jalur: "snbp",
      pilihan1,
      pilihan2,
      snbpProfile: {
        raporAverage: rawProfile.raporAverage,
        mapelPendukungAverage: rawProfile.mapelPendukungAverage,
        akreditasi: rawProfile.akreditasi as Akreditasi,
        prestasi: rawProfile.prestasi as PrestasiLevel,
      },
      pilihan1HasAlumni: body.pilihan1HasAlumni,
      pilihan2HasAlumni:
        typeof body.pilihan2HasAlumni === "boolean"
          ? body.pilihan2HasAlumni
          : false,
    },
  };
}

// ---------------------------------------------------------------------------
// Cache Key & Gemini Client (Zero PII)
// ---------------------------------------------------------------------------

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function buildCacheKey(
  payload: ValidatedAnalyzePayload,
  geminiModel: string
): string {
  const normalized =
    payload.jalur === "snbt"
      ? {
          jalur: "snbt",
          p1: payload.pilihan1.kode_prodi,
          p2: payload.pilihan2?.kode_prodi ?? null,
          score: Math.round(calculateSnbtUserScore(payload.snbtInput)),
          datasetVersion: DATASET_VERSION,
          model: geminiModel,
        }
      : {
          jalur: "snbp",
          p1: payload.pilihan1.kode_prodi,
          p2: payload.pilihan2?.kode_prodi ?? null,
          rapor: round1(payload.snbpProfile.raporAverage),
          mapel: round1(payload.snbpProfile.mapelPendukungAverage),
          akreditasi: payload.snbpProfile.akreditasi,
          prestasi: payload.snbpProfile.prestasi,
          alumni1: payload.pilihan1HasAlumni,
          alumni2: payload.pilihan2 ? payload.pilihan2HasAlumni : false,
          datasetVersion: DATASET_VERSION,
          model: geminiModel,
        };

  const digest = createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex");

  return `lolosptn:analyze:${digest}`;
}

function formatAnonymousChoice(
  prodi: ProdiIndexItem,
  prediction: PredictionResult
) {
  return {
    ptn: prodi.nama_ptn,
    prodi: prodi.nama,
    jenjang: prodi.jenjang,
    rumpun: prodi.rumpun,
    skor_acuan: prediction.referenceScore,
    peluang_persen: prediction.probability,
    rentang_sensitivitas_persen: [prediction.pLow, prediction.pHigh],
    status: prediction.status,
    data_terbatas: prediction.isUncertain,
  };
}

async function callGeminiAdvisor(params: {
  model: string;
  jalur: Jalur;
  pilihan1: ChoicePredictionSummary;
  pilihan2: ChoicePredictionSummary | null;
  alternatives: readonly AlternativeRecommendation[];
}): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  // Payload anonim (zero PII): hanya jalur, angka skor/prediksi, dan prodi
  const anonymousPayload = {
    jalur: params.jalur.toUpperCase(),
    skor_pengguna: params.pilihan1.prediction.userScore,
    pilihan_1: formatAnonymousChoice(
      params.pilihan1.prodi,
      params.pilihan1.prediction
    ),
    pilihan_2: params.pilihan2
      ? formatAnonymousChoice(params.pilihan2.prodi, params.pilihan2.prediction)
      : null,
    alternatif_f5: params.alternatives.map((alt) => ({
      ptn: alt.prodi.nama_ptn,
      prodi: alt.prodi.nama,
      jenjang: alt.prodi.jenjang,
      skor_acuan: alt.prediction.referenceScore,
      peluang_persen: alt.prediction.probability,
      status: alt.prediction.status,
    })),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      params.model
    )}:generateContent`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Analisis strategi berdasarkan data terhitung berikut:\n${JSON.stringify(
                  anonymousPayload
                )}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 700,
        },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const text = json.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    return text || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// POST /api/analyze
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body request harus berupa JSON yang valid." },
      { status: 400 }
    );
  }

  if (!isRecord(rawBody)) {
    return NextResponse.json(
      { error: "Body request harus berupa objek JSON." },
      { status: 400 }
    );
  }

  // (a) Validasi kode akses terhadap ACCESS_CODES (401 jika salah/kosong)
  const validCode = verifyAccessCode(rawBody.accessCode);
  if (!validCode) {
    return NextResponse.json(
      { error: "Kode akses tidak valid." },
      { status: 401 }
    );
  }

  // Validasi body input (400 jika tidak valid)
  const validated = validatePayload(rawBody);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }
  const payload = validated.data;

  // (b) Rate limit per IP-hash (429 jika melebihi batas)
  const ipHash = hashIp(extractClientIp(request));
  const rateLimit = await checkRateLimit(ipHash, {
    scope: "analyze",
    maxRequests: APP_CONFIG.rateLimit.maxRequests,
    windowSeconds: APP_CONFIG.rateLimit.windowSeconds,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.resetInSeconds) },
      }
    );
  }

  // (c) Kunci cache = input dibulatkan + dataset_version + GEMINI_MODEL aktif
  const geminiModel = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const cacheKey = buildCacheKey(payload, geminiModel);

  // (d) Cache hit: kembalikan hasil TANPA mengurangi kuota kode akses
  const cached = await getCache<CachedAnalyzeResult>(cacheKey);
  if (cached) {
    const responseBody: AnalyzeResponseBody = {
      alternatives: cached.alternatives,
      analysis: cached.analysis,
      cached: true,
      isFallback: false,
    };
    return NextResponse.json(responseBody, { status: 200 });
  }

  // (e) Cache miss: cek kuota pemakaian kode akses (403 jika habis)
  const maxCodeUses = parseMaxCodeUses();
  const currentUses = await getCodeUsage(validCode);
  if (currentUses >= maxCodeUses) {
    return NextResponse.json(
      { error: "Kode akses sudah mencapai batas pemakaian." },
      { status: 403 }
    );
  }

  // Hitung F2 (Pilihan 1 & 2) dan F5 (recommendAlternatives) di server
  let pilihan1Summary: ChoicePredictionSummary;
  let pilihan2Summary: ChoicePredictionSummary | null = null;
  let alternatives: AlternativeRecommendation[];

  if (payload.jalur === "snbt") {
    const target1 = toSnbtTarget(payload.pilihan1)!;
    pilihan1Summary = {
      prodi: payload.pilihan1,
      prediction: predictSnbt(payload.snbtInput, target1),
    };

    if (payload.pilihan2) {
      const target2 = toSnbtTarget(payload.pilihan2)!;
      pilihan2Summary = {
        prodi: payload.pilihan2,
        prediction: predictSnbt(payload.snbtInput, target2),
      };
    }

    alternatives = recommendAlternatives({
      jalur: "snbt",
      userInput: payload.snbtInput,
      pilihan1Kode: payload.pilihan1.kode_prodi,
      pilihan2Kode: payload.pilihan2?.kode_prodi ?? null,
    });
  } else {
    const target1 = toSnbpTarget(payload.pilihan1)!;
    pilihan1Summary = {
      prodi: payload.pilihan1,
      prediction: predictSnbp(
        { ...payload.snbpProfile, hasAlumni: payload.pilihan1HasAlumni },
        target1
      ),
    };

    if (payload.pilihan2) {
      const target2 = toSnbpTarget(payload.pilihan2)!;
      pilihan2Summary = {
        prodi: payload.pilihan2,
        prediction: predictSnbp(
          { ...payload.snbpProfile, hasAlumni: payload.pilihan2HasAlumni },
          target2
        ),
      };
    }

    alternatives = recommendAlternatives({
      jalur: "snbp",
      userInput: {
        ...payload.snbpProfile,
        hasAlumni: payload.pilihan1HasAlumni,
      },
      pilihan1Kode: payload.pilihan1.kode_prodi,
      pilihan2Kode: payload.pilihan2?.kode_prodi ?? null,
    });
  }

  // Panggil Gemini API (payload anonim + timeout 12 detik)
  const aiAnalysis = await callGeminiAdvisor({
    model: geminiModel,
    jalur: payload.jalur,
    pilihan1: pilihan1Summary,
    pilihan2: pilihan2Summary,
    alternatives,
  });

  if (aiAnalysis) {
    // Gemini berhasil: simpan ke cache (24 jam) & kurangi kuota kode
    await setCache<CachedAnalyzeResult>(
      cacheKey,
      { alternatives, analysis: aiAnalysis },
      CACHE_TTL_SECONDS
    );
    await incrementCodeUsage(validCode);

    const responseBody: AnalyzeResponseBody = {
      alternatives,
      analysis: aiAnalysis,
      cached: false,
      isFallback: false,
    };
    return NextResponse.json(responseBody, { status: 200 });
  }

  // Gemini gagal / timeout / API key kosong:
  // gunakan fallback.ts, JANGAN simpan ke cache, JANGAN kurangi kuota kode
  const fallbackAnalysis = generateFallbackAnalysis({
    jalur: payload.jalur,
    pilihan1: pilihan1Summary,
    pilihan2: pilihan2Summary,
    alternatives,
  });

  const responseBody: AnalyzeResponseBody = {
    alternatives,
    analysis: fallbackAnalysis,
    cached: false,
    isFallback: true,
  };
  return NextResponse.json(responseBody, { status: 200 });
}
