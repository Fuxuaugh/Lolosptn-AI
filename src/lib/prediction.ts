/**
 * Deterministic Prediction Engine (F2) & Smart Alternative Recommender (F5).
 * Pure logic — dilarang mengandung class CSS/styling atau string tampilan UI.
 * Seluruh konstanta bisnis dibaca dari `src/config/app.config.ts`.
 */

import {
  APP_CONFIG,
  type Akreditasi,
  type Jalur,
  type PrestasiLevel,
  type StatusKategori,
} from "@/config/app.config";
import {
  DATASET_ITEMS,
  type AcuanDibatasi,
  type ProdiDetail,
  type ProdiIndexItem,
} from "@/lib/dataset";

// ---------------------------------------------------------------------------
// Tipe Input & Output
// ---------------------------------------------------------------------------

export type SnbtScoreInput =
  | { mode: "average"; averageScore: number }
  | { mode: "subtests"; subtests: readonly number[] };

export interface SnbtTarget {
  skor_acuan: number;
  is_new: 0 | 1;
  jumlah_tahun_histori: number;
  acuan_dibatasi?: AcuanDibatasi;
}

export interface SnbpProfileInput {
  raporAverage: number;
  mapelPendukungAverage: number;
  akreditasi: Akreditasi;
  /** Rekam jejak alumni di PTN tujuan (diisi terpisah per pilihan). */
  hasAlumni: boolean;
  prestasi: PrestasiLevel;
}

export interface SnbpTarget {
  rapor_acuan: number;
  is_new: 0 | 1;
  jumlah_tahun_histori: number;
  acuan_dibatasi?: AcuanDibatasi;
}

export interface TargetScoreResult {
  targetProbability: number;
  requiredScore: number;
  /** Selisih positif yang dibutuhkan dari skor/nilai saat ini (0 jika sudah terpenuhi). */
  gap: number;
  /** True jika skor target melebihi skala maksimum (SNBT > 1000, SNBP > 100). */
  isOutOfScale: boolean;
  /** Status pembatasan (clamp) acuan pada pipeline data. */
  acuanDibatasi: AcuanDibatasi;
}

export interface PredictionResult {
  /** S_user (SNBT) atau S_snbp (SNBP) */
  userScore: number;
  /** skor_acuan (SNBT) atau rapor_acuan (SNBP) */
  referenceScore: number;
  /** ΔS atau ΔR (userScore - referenceScore) */
  delta: number;
  /** δ sensitivitas yang diterapkan (normal atau uncertain) */
  sensitivityDelta: number;
  /** Peluang P dalam persen (0–100) */
  probability: number;
  /** Batas bawah rentang sensitivitas (memakai acuan + δ) */
  pLow: number;
  /** Batas atas rentang sensitivitas (memakai acuan - δ) */
  pHigh: number;
  /** Kategori status tunggal: "safe" | "target" | "reach" */
  status: StatusKategori;
  /** True bila prodi baru (is_new === 1) atau histori < minHistoriYears */
  isUncertain: boolean;
}

export interface AlternativeRecommendation {
  prodi: ProdiIndexItem;
  prediction: PredictionResult;
}

export type RecommendAlternativesParams =
  | {
      jalur: "snbt";
      userInput: SnbtScoreInput;
      pilihan1Kode: string;
      pilihan2Kode?: string | null;
      dataset?: readonly ProdiIndexItem[];
    }
  | {
      jalur: "snbp";
      /** `hasAlumni` pada objek ini adalah status alumni di PTN Pilihan 1. */
      userInput: SnbpProfileInput;
      pilihan1Kode: string;
      pilihan2Kode?: string | null;
      dataset?: readonly ProdiIndexItem[];
    };

// ---------------------------------------------------------------------------
// Utilitas Matematika Deterministik
// ---------------------------------------------------------------------------

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Menghitung skor/nilai target untuk mencapai probabilitas `targetProbability`
 * (0 < P < 100) berdasarkan invers kurva sigmoid:
 *   S_target = acuan + ln(P / (1 - P)) / k
 */
export function calculateRequiredScore(params: {
  jalur: Jalur;
  referenceScore: number;
  userScore: number;
  targetProbability?: number;
  acuanDibatasi?: AcuanDibatasi;
}): TargetScoreResult {
  const targetProbability =
    params.targetProbability ?? APP_CONFIG.statusThresholds.safe;
  if (
    !Number.isFinite(targetProbability) ||
    targetProbability <= 0 ||
    targetProbability >= 100
  ) {
    throw new Error("targetProbability must be between 0 and 100 (exclusive)");
  }

  const k =
    params.jalur === "snbt"
      ? APP_CONFIG.sigmoid.k_snbt
      : APP_CONFIG.sigmoid.k_snbp;
  const maxBound =
    params.jalur === "snbt"
      ? APP_CONFIG.inputBounds.snbt.max
      : APP_CONFIG.inputBounds.snbp.max;

  const ratio = targetProbability / 100;
  const requiredDelta = Math.log(ratio / (1 - ratio)) / k;
  const requiredScore = round2(params.referenceScore + requiredDelta);
  const gap = round2(Math.max(0, requiredScore - params.userScore));
  const isOutOfScale = requiredScore > maxBound;

  return {
    targetProbability,
    requiredScore,
    gap,
    isOutOfScale,
    acuanDibatasi: params.acuanDibatasi ?? null,
  };
}

/**
 * Kurva sigmoid: P = 100 / (1 + exp(-k * delta))
 */
export function calculateSigmoidProbability(delta: number, k: number): number {
  return 100 / (1 + Math.exp(-k * delta));
}

/**
 * Memetakan probabilitas (0–100) ke kategori status tunggal dari `APP_CONFIG`.
 * - P >= 75       -> "safe"
 * - 50 <= P < 75  -> "target"
 * - P < 50        -> "reach"
 */
export function getStatusFromProbability(probability: number): StatusKategori {
  if (probability >= APP_CONFIG.statusThresholds.safe) {
    return "safe";
  }
  if (probability >= APP_CONFIG.statusThresholds.target) {
    return "target";
  }
  return "reach";
}

export function isTargetUncertain(
  isNew: 0 | 1,
  jumlahTahunHistori: number
): boolean {
  return isNew === 1 || jumlahTahunHistori < APP_CONFIG.sensitivity.minHistoriYears;
}

// ---------------------------------------------------------------------------
// Adapter Target dari Dataset
// ---------------------------------------------------------------------------

export function toSnbtTarget(
  prodi: ProdiIndexItem | ProdiDetail
): SnbtTarget | null {
  if (!prodi.snbt.tersedia) return null;
  const jumlahTahunHistori =
    "jumlah_tahun_histori" in prodi.snbt
      ? prodi.snbt.jumlah_tahun_histori
      : prodi.snbt.historis.length;

  return {
    skor_acuan: prodi.snbt.skor_acuan,
    is_new: prodi.is_new,
    jumlah_tahun_histori: jumlahTahunHistori,
    acuan_dibatasi: prodi.snbt.acuan_dibatasi ?? null,
  };
}

export function toSnbpTarget(
  prodi: ProdiIndexItem | ProdiDetail
): SnbpTarget | null {
  if (!prodi.snbp.tersedia) return null;
  const jumlahTahunHistori =
    "jumlah_tahun_histori" in prodi.snbp
      ? prodi.snbp.jumlah_tahun_histori
      : prodi.snbp.historis.length;

  return {
    rapor_acuan: prodi.snbp.rapor_acuan,
    is_new: prodi.is_new,
    jumlah_tahun_histori: jumlahTahunHistori,
    acuan_dibatasi: prodi.snbp.acuan_dibatasi ?? null,
  };
}

// ---------------------------------------------------------------------------
// F2.A: Kalkulasi SNBT
// ---------------------------------------------------------------------------

export function calculateSnbtUserScore(input: SnbtScoreInput): number {
  if (input.mode === "average") {
    if (!Number.isFinite(input.averageScore)) {
      throw new Error("Average SNBT score must be a finite number");
    }
    return round2(input.averageScore);
  }

  const expectedCount = APP_CONFIG.inputBounds.snbt.subtestCount;
  if (input.subtests.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} SNBT subtests, got ${input.subtests.length}`);
  }

  let sum = 0;
  for (const score of input.subtests) {
    if (!Number.isFinite(score)) {
      throw new Error("All SNBT subtest scores must be finite numbers");
    }
    sum += score;
  }

  return round2(sum / expectedCount);
}

export function predictSnbt(
  input: SnbtScoreInput,
  target: SnbtTarget
): PredictionResult {
  const userScore = calculateSnbtUserScore(input);
  const referenceScore = target.skor_acuan;
  const isUncertain = isTargetUncertain(
    target.is_new,
    target.jumlah_tahun_histori
  );
  const sensitivityDelta = isUncertain
    ? APP_CONFIG.sensitivity.snbtUncertain
    : APP_CONFIG.sensitivity.snbt;

  const k = APP_CONFIG.sigmoid.k_snbt;
  const delta = round2(userScore - referenceScore);
  const probability = round2(calculateSigmoidProbability(delta, k));
  const pLow = round2(
    calculateSigmoidProbability(userScore - (referenceScore + sensitivityDelta), k)
  );
  const pHigh = round2(
    calculateSigmoidProbability(userScore - (referenceScore - sensitivityDelta), k)
  );
  const status = getStatusFromProbability(probability);

  return {
    userScore,
    referenceScore,
    delta,
    sensitivityDelta,
    probability,
    pLow,
    pHigh,
    status,
    isUncertain,
  };
}

// ---------------------------------------------------------------------------
// F2.B: Kalkulasi SNBP
// ---------------------------------------------------------------------------

export function calculateSnbpCompositeScore(input: SnbpProfileInput): number {
  if (
    !Number.isFinite(input.raporAverage) ||
    !Number.isFinite(input.mapelPendukungAverage)
  ) {
    throw new Error("SNBP rapor and mapel averages must be finite numbers");
  }

  const { snbpWeights, skorSekolahAlumni, skorPrestasi } = APP_CONFIG;
  const alumniMap = skorSekolahAlumni[input.akreditasi];
  const scoreSekolahAlumni = input.hasAlumni ? alumniMap.ada : alumniMap.tidakAda;
  const scorePrestasi = skorPrestasi[input.prestasi];

  const composite =
    snbpWeights.rapor * input.raporAverage +
    snbpWeights.mapel * input.mapelPendukungAverage +
    snbpWeights.sekolahAlumni * scoreSekolahAlumni +
    snbpWeights.prestasi * scorePrestasi;

  return round2(composite);
}

export function predictSnbp(
  input: SnbpProfileInput,
  target: SnbpTarget
): PredictionResult {
  const userScore = calculateSnbpCompositeScore(input);
  const referenceScore = target.rapor_acuan;
  const isUncertain = isTargetUncertain(
    target.is_new,
    target.jumlah_tahun_histori
  );
  const sensitivityDelta = isUncertain
    ? APP_CONFIG.sensitivity.snbpUncertain
    : APP_CONFIG.sensitivity.snbp;

  const k = APP_CONFIG.sigmoid.k_snbp;
  const delta = round2(userScore - referenceScore);
  const probability = round2(calculateSigmoidProbability(delta, k));
  const pLow = round2(
    calculateSigmoidProbability(userScore - (referenceScore + sensitivityDelta), k)
  );
  const pHigh = round2(
    calculateSigmoidProbability(userScore - (referenceScore - sensitivityDelta), k)
  );
  const status = getStatusFromProbability(probability);

  return {
    userScore,
    referenceScore,
    delta,
    sensitivityDelta,
    probability,
    pLow,
    pHigh,
    status,
    isUncertain,
  };
}

// ---------------------------------------------------------------------------
// F5: Smart Alternative Recommender
// ---------------------------------------------------------------------------

export function recommendAlternatives(
  params: RecommendAlternativesParams
): AlternativeRecommendation[] {
  const dataset = params.dataset ?? DATASET_ITEMS;
  const pilihan1 = dataset.find(
    (item) => item.kode_prodi === params.pilihan1Kode
  );

  if (!pilihan1) {
    return [];
  }

  const excludedCodes = new Set<string>([params.pilihan1Kode]);
  if (params.pilihan2Kode) {
    excludedCodes.add(params.pilihan2Kode);
  }

  const safeCandidates: AlternativeRecommendation[] = [];
  const targetCandidates: AlternativeRecommendation[] = [];

  for (const candidate of dataset) {
    if (excludedCodes.has(candidate.kode_prodi)) continue;
    if (candidate.rumpun !== pilihan1.rumpun) continue;

    let prediction: PredictionResult | null = null;

    if (params.jalur === "snbt") {
      const target = toSnbtTarget(candidate);
      if (!target) continue;
      prediction = predictSnbt(params.userInput, target);
    } else {
      const target = toSnbpTarget(candidate);
      if (!target) continue;
      // Aturan F5: PTN sama dengan Pilihan 1 -> pakai input pengguna; PTN berbeda -> Tidak Ada (false)
      const hasAlumni =
        candidate.id_ptn === pilihan1.id_ptn ? params.userInput.hasAlumni : false;
      prediction = predictSnbp(
        {
          ...params.userInput,
          hasAlumni,
        },
        target
      );
    }

    if (prediction.status === "safe") {
      safeCandidates.push({ prodi: candidate, prediction });
    } else if (prediction.status === "target") {
      targetCandidates.push({ prodi: candidate, prediction });
    }
  }

  // Kandidat Aman: urutkan skor_acuan / rapor_acuan MENURUN (paling prestisius yang tetap aman)
  safeCandidates.sort(
    (a, b) =>
      b.prediction.referenceScore - a.prediction.referenceScore ||
      b.prediction.probability - a.prediction.probability ||
      a.prodi.kode_prodi.localeCompare(b.prodi.kode_prodi)
  );

  const maxAlternatives = APP_CONFIG.recommender.maxAlternatives;
  const selected = safeCandidates.slice(0, maxAlternatives);

  // Fallback Moderat: jika kandidat Aman < maxAlternatives, lengkapi dari Moderat urut P MENURUN
  if (selected.length < maxAlternatives) {
    targetCandidates.sort(
      (a, b) =>
        b.prediction.probability - a.prediction.probability ||
        b.prediction.referenceScore - a.prediction.referenceScore ||
        a.prodi.kode_prodi.localeCompare(b.prodi.kode_prodi)
    );
    const remaining = maxAlternatives - selected.length;
    selected.push(...targetCandidates.slice(0, remaining));
  }

  return selected;
}
