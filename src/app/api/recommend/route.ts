/**
 * POST /api/recommend — Rekomendasi 3 Alternatif Gratis & Ringkasan Otomatis.
 *
 * Tanpa kode akses dan TANPA panggilan Gemini (biaya operasional Rp0).
 * Tetap dihitung di server dan dibatasi maksimal `APP_CONFIG.recommender.maxAlternatives` (3)
 * agar data alternatif premium tidak pernah dikirim ke klien.
 * Dilindungi rate limit per IP-hash (TTL <= 1 jam).
 */

import { NextResponse } from "next/server";
import {
  APP_CONFIG,
  type Akreditasi,
  type PrestasiLevel,
} from "@/config/app.config";
import { findProdiByKode, type ProdiIndexItem } from "@/lib/dataset";
import {
  generateFallbackAnalysis,
  type ChoicePredictionSummary,
} from "@/lib/fallback";
import {
  predictSnbp,
  predictSnbt,
  recommendAlternatives,
  toSnbpTarget,
  toSnbtTarget,
  type AlternativeRecommendation,
  type SnbpProfileInput,
  type SnbtScoreInput,
} from "@/lib/prediction";
import { checkRateLimit, extractClientIp, hashIp } from "@/lib/redis";

const VALID_AKREDITASI = new Set<string>(["A", "B", "C"]);
const VALID_PRESTASI = new Set<string>([
  "nasional",
  "provinsi",
  "kabupaten",
  "tidak_ada",
]);

type ValidatedRecommendPayload =
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

export interface RecommendResponseBody {
  alternatives: AlternativeRecommendation[];
  summary: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteInRange(
  value: unknown,
  min: number,
  max: number
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}

function validatePayload(
  body: Record<string, unknown>
):
  | { ok: true; data: ValidatedRecommendPayload }
  | { ok: false; error: string } {
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
  if (
    body.pilihan2Kode !== undefined &&
    body.pilihan2Kode !== null &&
    body.pilihan2Kode !== ""
  ) {
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
        error:
          "Pilihan 2 tidak ditemukan atau tidak tersedia pada jalur terpilih.",
      };
    }
    pilihan2 = found2;
  }

  if (jalur === "snbt") {
    const { min, max, subtestCount } = APP_CONFIG.inputBounds.snbt;
    const rawSnbt = body.snbtInput;
    if (!isRecord(rawSnbt)) {
      return {
        ok: false,
        error: "Field 'snbtInput' wajib diisi untuk jalur SNBT.",
      };
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
          snbtInput: {
            mode: "subtests",
            subtests: rawSnbt.subtests as number[],
          },
        },
      };
    }

    return {
      ok: false,
      error: "Field 'snbtInput.mode' harus 'average' atau 'subtests'.",
    };
  }

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

  const validated = validatePayload(rawBody);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }
  const payload = validated.data;

  const ipHash = hashIp(extractClientIp(request));
  const rateLimit = await checkRateLimit(ipHash, {
    scope: "recommend",
    maxRequests: APP_CONFIG.rateLimit.recommendMaxRequests,
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
    }).slice(0, APP_CONFIG.recommender.maxAlternatives);
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
    }).slice(0, APP_CONFIG.recommender.maxAlternatives);
  }

  const summary = generateFallbackAnalysis({
    jalur: payload.jalur,
    pilihan1: pilihan1Summary,
    pilihan2: pilihan2Summary,
    alternatives,
  });

  const responseBody: RecommendResponseBody = {
    alternatives,
    summary,
  };

  return NextResponse.json(responseBody, { status: 200 });
}
