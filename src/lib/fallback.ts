/**
 * Ringkasan otomatis deterministik berbasis template (Gratis & F6 Fallback).
 * Dipakai untuk Ringkasan Otomatis di hasil gratis dan saat Gemini gagal/timeout.
 * Menghasilkan maksimal 3 paragraf Bahasa Indonesia berbasis angka F2 & F5
 * tanpa mengarang angka baru, tanpa menyarankan tukar urutan untuk menaikkan
 * peluang total, dan tanpa menyarankan menaikkan rapor pada jalur SNBP.
 */

import {
  APP_CONFIG,
  type Jalur,
  type StatusKategori,
} from "@/config/app.config";
import type { ProdiIndexItem } from "@/lib/dataset";
import {
  calculateRequiredScore,
  type AlternativeRecommendation,
  type PredictionResult,
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

export function generateFallbackAnalysis(input: FallbackAnalysisInput): string {
  const { jalur, pilihan1, pilihan2, alternatives } = input;
  const jalurLabel = jalur.toUpperCase();
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

  // Paragraf 2: Catatan strategi pilihan & alternatif F5
  const strategyTips: string[] = [];
  if (pilihan2) {
    if (
      p1.status === "reach" &&
      pilihan2.prediction.status === "reach"
    ) {
      strategyTips.push(
        `Kedua pilihanmu sama-sama berstatus Spekulatif. Pertimbangkan mengganti salah satu pilihan dengan prodi berstatus Aman atau Moderat sebagai pengaman.`
      );
    } else if (pilihan2.prediction.probability < p1.probability) {
      strategyTips.push(
        `Pilihan 2 saat ini lebih kompetitif dibanding Pilihan 1. Urutan pilihan tidak mengubah peluang total, tetapi menentukan prodi yang kamu peroleh jika memenuhi keduanya — tempatkan prodi yang paling kamu inginkan di Pilihan 1.`
      );
    } else {
      strategyTips.push(
        `Kombinasi pilihanmu sudah berjenjang dari target utama ke opsi yang lebih realistis. Tempatkan prodi yang paling kamu prioritaskan di Pilihan 1.`
      );
    }
  } else if (p1.status !== "safe") {
    strategyTips.push(
      `Karena kamu baru mengisi 1 pilihan dengan status ${p1Status}, menambahkan Pilihan 2 yang lebih aman dapat membantu mengurangi risiko.`
    );
  } else {
    strategyTips.push(
      `Pilihan 1 sudah berada pada posisi Aman; kamu tetap dapat memanfaatkan slot Pilihan 2 sebagai opsi cadangan sesuai minat.`
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
    strategyTips.push(
      `Alternatif serumpun (${pilihan1.prodi.rumpun}) yang bisa dipertimbangkan: ${altList}.`
    );
  } else {
    strategyTips.push(
      `Saat ini belum ada alternatif berstatus Aman atau Moderat di rumpun ${pilihan1.prodi.rumpun} yang sesuai dengan posisimu.`
    );
  }

  const paragraph2 = strategyTips.join(" ");

  // Paragraf 3: Langkah taktis (dibedakan ketat antara SNBT dan SNBP)
  let paragraph3: string;

  if (jalur === "snbp") {
    paragraph3 =
      `Karena nilai rapor semester 1–5 sudah tetap, langkah yang bisa kamu lakukan pada jalur SNBP adalah memilih kombinasi prodi yang realistis sesuai minat, memastikan status eligibilitas sekolah/siswa serta kepemilikan nilai TKA sesuai ketentuan SNPMB terbaru (aturan 2027 menunggu juknis resmi), dan menyiapkan syarat portofolio bila diminta. ` +
      `Perlu diingat bahwa model SNBP ini belum terkalibrasi dengan data kelulusan individu sehingga gunakan hanya sebagai gambaran arah.`;
  } else {
    const snbtClamp = pilihan1.prodi.snbt.tersedia
      ? pilihan1.prodi.snbt.acuan_dibatasi ?? null
      : null;
    const safeTarget = calculateRequiredScore({
      jalur: "snbt",
      referenceScore: p1.referenceScore,
      userScore: p1.userScore,
      targetProbability: APP_CONFIG.statusThresholds.safe,
      acuanDibatasi: snbtClamp,
    });

    if (p1.status === "safe") {
      paragraph3 =
        `Skormu sudah melewati target kategori Aman (≥${APP_CONFIG.statusThresholds.safe}%) untuk Pilihan 1. ` +
        `Pertahankan konsistensi skor latihan di atas ${fmtScore(p1.userScore, "snbt")}, pantau tren peminat dan kuota terbaru, serta siapkan syarat portofolio bila diminta prodi tujuan.`;
    } else if (safeTarget.isOutOfScale) {
      paragraph3 =
        `Target skor kategori Aman (≥${APP_CONFIG.statusThresholds.safe}%) untuk Pilihan 1 berada di luar skala UTBK (di atas ${APP_CONFIG.inputBounds.snbt.max}). ` +
        `Pertimbangkan memaksimalkan skor latihan sebaik mungkin sambil menyiapkan salah satu alternatif realistis di atas sebagai opsi pengaman.`;
    } else {
      const clampNote =
        safeTarget.acuanDibatasi === "atas"
          ? ` Catatan: acuan dibatasi pada ${APP_CONFIG.acuanClamp.snbt.max}, sehingga persaingan sebenarnya bisa lebih ketat.`
          : safeTarget.acuanDibatasi === "bawah"
            ? ` Catatan: acuan dibatasi pada ${APP_CONFIG.acuanClamp.snbt.min}, sehingga target ini kemungkinan terlalu tinggi.`
            : "";

      paragraph3 =
        `Untuk mencapai kategori Aman (≥${APP_CONFIG.statusThresholds.safe}%) pada Pilihan 1, ` +
        `target skor rata-rata berada di kisaran ${fmtScore(safeTarget.requiredScore, "snbt")} ` +
        `(selisih +${fmtScore(safeTarget.gap, "snbt")} poin UTBK dari skormu saat ini).${clampNote} ` +
        `Jika jarak kenaikan tersebut terasa berat untuk sisa waktu persiapan, pertimbangkan memilih salah satu alternatif di atas sebagai opsi pengaman.`;
    }
  }

  return [paragraph1, paragraph2, paragraph3].join("\n\n");
}
