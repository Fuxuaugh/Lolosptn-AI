/**
 * Analisis strategi naratif template deterministik (F6 Fallback).
 * Dipakai hanya saat Gemini gagal, timeout, atau GEMINI_API_KEY kosong.
 * Menghasilkan maksimal 3 paragraf Bahasa Indonesia berbasis angka F2 & F5
 * tanpa mengarang angka baru.
 */

import {
  APP_CONFIG,
  type Jalur,
  type StatusKategori,
} from "@/config/app.config";
import type { ProdiIndexItem } from "@/lib/dataset";
import type {
  AlternativeRecommendation,
  PredictionResult,
} from "@/lib/prediction";

export interface ChoicePredictionSummary {
  prodi: ProdiIndexItem;
  prediction: PredictionResult;
}

export interface FallbackAnalysisInput {
  jalur: Jalur;
  pilihan1: ChoicePredictionSummary;
  pilihan2: ChoicePredictionSummary | null;
  alternatives: readonly AlternativeRecommendation[];
}

const STATUS_LABEL_ID: Record<StatusKategori, string> = {
  safe: "Aman",
  target: "Moderat",
  reach: "Spekulatif",
};

function fmtPct(value: number): string {
  return `${Math.round(value)}%`;
}

function fmtScore(value: number, jalur: Jalur): string {
  return jalur === "snbt" ? value.toFixed(1) : value.toFixed(2);
}

/**
 * Menghitung tambahan skor/nilai yang dibutuhkan untuk mencapai probabilitas
 * target `targetPct` pada kurva sigmoid P = 100 / (1 + exp(-k * delta)).
 */
function neededScoreIncrease(
  currentScore: number,
  referenceScore: number,
  targetPct: number,
  jalur: Jalur
): number {
  const k =
    jalur === "snbt" ? APP_CONFIG.sigmoid.k_snbt : APP_CONFIG.sigmoid.k_snbp;
  const ratio = targetPct / 100;
  const requiredDelta = Math.log(ratio / (1 - ratio)) / k;
  const requiredScore = referenceScore + requiredDelta;
  return Math.max(0, requiredScore - currentScore);
}

export function generateFallbackAnalysis(input: FallbackAnalysisInput): string {
  const { jalur, pilihan1, pilihan2, alternatives } = input;
  const jalurLabel = jalur.toUpperCase();
  const scoreUnit = jalur === "snbt" ? "poin UTBK" : "poin skor komposit";
  const scoreNoun = jalur === "snbt" ? "skor UTBK" : "skor komposit SNBP";

  const p1 = pilihan1.prediction;
  const p1Status = STATUS_LABEL_ID[p1.status];
  const p1Label = `${pilihan1.prodi.nama} (${pilihan1.prodi.jenjang}) di ${pilihan1.prodi.nama_ptn}`;

  // Paragraf 1: Posisi Pilihan 1 & 2
  let paragraph1 =
    `Pada jalur ${jalurLabel}, ${scoreNoun} kamu sebesar ${fmtScore(p1.userScore, jalur)} ` +
    `dibandingkan acuan estimasi ${fmtScore(p1.referenceScore, jalur)} untuk Pilihan 1 (${p1Label}) ` +
    `menempatkanmu pada peluang ${fmtPct(p1.probability)} ` +
    `(rentang sensitivitas ${fmtPct(p1.pLow)}–${fmtPct(p1.pHigh)}, status ${p1Status}).`;

  if (pilihan2) {
    const p2 = pilihan2.prediction;
    const p2Status = STATUS_LABEL_ID[p2.status];
    const p2Label = `${pilihan2.prodi.nama} (${pilihan2.prodi.jenjang}) di ${pilihan2.prodi.nama_ptn}`;
    paragraph1 +=
      ` Sementara itu, Pilihan 2 (${p2Label}) memiliki acuan estimasi ${fmtScore(p2.referenceScore, jalur)} ` +
      `dengan peluang ${fmtPct(p2.probability)} ` +
      `(rentang sensitivitas ${fmtPct(p2.pLow)}–${fmtPct(p2.pHigh)}, status ${p2Status}).`;
  }

  // Paragraf 2: Saran urutan pilihan & alternatif F5
  const orderingTips: string[] = [];
  if (pilihan2) {
    if (pilihan2.prediction.probability < p1.probability) {
      orderingTips.push(
        `Urutan pilihanmu saat ini menempatkan prodi yang lebih kompetitif di Pilihan 2; pertimbangkan menukar urutan jika Pilihan 2 lebih kamu prioritaskan, atau pilih Pilihan 2 dengan peluang lebih tinggi sebagai pengaman.`
      );
    } else if (
      p1.status === "reach" &&
      pilihan2.prediction.status === "reach"
    ) {
      orderingTips.push(
        `Kedua pilihanmu sama-sama berstatus Spekulatif, sehingga disarankan menempatkan minimal satu prodi berstatus Aman atau Moderat di Pilihan 2 untuk mengurangi risiko.`
      );
    } else {
      orderingTips.push(
        `Kombinasi urutan Pilihan 1 dan Pilihan 2 sudah cukup berjenjang dari target utama ke pilihan yang lebih realistis.`
      );
    }
  } else if (p1.status !== "safe") {
    orderingTips.push(
      `Karena kamu baru mengisi 1 pilihan dengan status ${p1Status}, menambahkan Pilihan 2 yang lebih aman sangat dianjurkan sebagai strategi pengaman.`
    );
  } else {
    orderingTips.push(
      `Pilihan 1 sudah berada pada posisi Aman; kamu tetap dapat memanfaatkan slot Pilihan 2 untuk menjaga peluang tetap optimal.`
    );
  }

  if (alternatives.length > 0) {
    const altList = alternatives
      .map(
        (alt, idx) =>
          `${idx + 1}) ${alt.prodi.nama} (${alt.prodi.jenjang}) – ${alt.prodi.nama_ptn} ` +
          `[${STATUS_LABEL_ID[alt.prediction.status]}, peluang ${fmtPct(alt.prediction.probability)}]`
      )
      .join("; ");
    orderingTips.push(
      `Alternatif realistis di rumpun ${pilihan1.prodi.rumpun} yang bisa dipertimbangkan: ${altList}.`
    );
  } else {
    orderingTips.push(
      `Saat ini belum ada alternatif berstatus Aman atau Moderat di rumpun ${pilihan1.prodi.rumpun} yang sesuai dengan posisimu.`
    );
  }

  const paragraph2 = orderingTips.join(" ");

  // Paragraf 3: Target kenaikan skor/nilai realistis
  let paragraph3: string;
  if (p1.status === "safe") {
    paragraph3 =
      `Target strategi untukmu adalah mempertahankan konsistensi capaian di atas ${fmtScore(p1.userScore, jalur)} ` +
      `agar posisi tetap berada di kategori Aman (≥${APP_CONFIG.statusThresholds.safe}%). ` +
      `Pantau terus tren peminat dan daya tampung tahun berjalan serta siapkan syarat portofolio bila diminta prodi tujuan.`;
  } else if (p1.status === "target") {
    const gapToSafe = neededScoreIncrease(
      p1.userScore,
      p1.referenceScore,
      APP_CONFIG.statusThresholds.safe,
      jalur
    );
    paragraph3 =
      `Untuk menaikkan peluang Pilihan 1 ke kategori Aman (≥${APP_CONFIG.statusThresholds.safe}%), ` +
      `kamu perlu menambah sekitar ${fmtScore(gapToSafe, jalur)} ${scoreUnit} ` +
      `sehingga mencapai kisaran ${fmtScore(p1.userScore + gapToSafe, jalur)}. ` +
      `Fokuskan peningkatan pada komponen dengan bobot terbesar sambil tetap menyiapkan pilihan pengaman yang realistis.`;
  } else {
    const gapToTarget = neededScoreIncrease(
      p1.userScore,
      p1.referenceScore,
      APP_CONFIG.statusThresholds.target,
      jalur
    );
    const gapToSafe = neededScoreIncrease(
      p1.userScore,
      p1.referenceScore,
      APP_CONFIG.statusThresholds.safe,
      jalur
    );
    paragraph3 =
      `Agar Pilihan 1 mencapai kategori Moderat (≥${APP_CONFIG.statusThresholds.target}%), ` +
      `dibutuhkan peningkatan sekitar ${fmtScore(gapToTarget, jalur)} ${scoreUnit} ` +
      `(atau sekitar ${fmtScore(gapToSafe, jalur)} ${scoreUnit} untuk kategori Aman ≥${APP_CONFIG.statusThresholds.safe}%). ` +
      `Jika jarak kenaikan tersebut cukup besar untuk sisa waktu persiapan, pertimbangkan memilih salah satu alternatif di atas sebagai opsi utama atau pengaman.`;
  }

  return [paragraph1, paragraph2, paragraph3].join("\n\n");
}
