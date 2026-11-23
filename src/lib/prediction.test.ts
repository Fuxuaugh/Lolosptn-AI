import { describe, expect, it } from "vitest";
import { APP_CONFIG } from "@/config/app.config";
import {
  DATASET_ITEMS,
  DATASET_VERSION,
  findProdiByKode,
  getProdiByJalur,
  getPtnList,
  type ProdiIndexItem,
} from "@/lib/dataset";
import {
  calculateRequiredScore,
  calculateSnbtUserScore,
  calculateSnbpCompositeScore,
  getStatusFromProbability,
  predictSnbt,
  predictSnbp,
  recommendAlternatives,
  toSnbpTarget,
  toSnbtTarget,
} from "@/lib/prediction";

const INFORMATIKA_UPNVJT_KODE = "13851006";

function makeProdi(
  overrides: Partial<ProdiIndexItem> & {
    kode_prodi: string;
    id_ptn?: number;
    rumpun?: string;
  }
): ProdiIndexItem {
  return {
    id_ptn: overrides.id_ptn ?? 385,
    nama_ptn: overrides.nama_ptn ?? 'UPN "VETERAN" JAWA TIMUR',
    kode_prodi: overrides.kode_prodi,
    nama: overrides.nama ?? `PRODI ${overrides.kode_prodi}`,
    jenjang: overrides.jenjang ?? "S1",
    rumpun: overrides.rumpun ?? "Komputer & IT",
    is_new: overrides.is_new ?? 0,
    snbt: overrides.snbt ?? {
      tersedia: true,
      skor_acuan: 580,
      jumlah_tahun_histori: 3,
    },
    snbp: overrides.snbp ?? {
      tersedia: true,
      rapor_acuan: 86,
      jumlah_tahun_histori: 3,
    },
  };
}

describe("Dataset Loader (data/index.json)", () => {
  it("memuat dataset statis dengan 17 PTN Jatim dan INFORMATIKA UPNVJT (13851006)", () => {
    expect(DATASET_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(DATASET_ITEMS.length).toBeGreaterThan(0);
    expect(getPtnList()).toHaveLength(17);

    const inf = findProdiByKode(INFORMATIKA_UPNVJT_KODE);
    expect(inf).toBeDefined();
    expect(inf?.nama).toBe("INFORMATIKA");
    expect(inf?.snbt.tersedia).toBe(true);
    expect(inf?.snbp.tersedia).toBe(true);

    const prodiUpnSnbt = getProdiByJalur("snbt", 385);
    expect(prodiUpnSnbt.length).toBeGreaterThan(0);
    expect(prodiUpnSnbt.every((p) => p.id_ptn === 385 && p.snbt.tersedia)).toBe(
      true
    );
  });
});

describe("Status Thresholds (Single Source of Truth)", () => {
  it("memetakan batas kategori status dengan benar (75% -> safe, 50% -> target, 49.9% -> reach)", () => {
    expect(getStatusFromProbability(100)).toBe("safe");
    expect(getStatusFromProbability(75)).toBe("safe");
    expect(getStatusFromProbability(74.99)).toBe("target");
    expect(getStatusFromProbability(50)).toBe("target");
    expect(getStatusFromProbability(49.9)).toBe("reach");
    expect(getStatusFromProbability(0)).toBe("reach");
  });
});

describe("SNBT Prediction Engine (F2.A)", () => {
  it("menghasilkan P tepat 50% saat skor user == skor_acuan (INFORMATIKA UPNVJT 13851006)", () => {
    const prodi = findProdiByKode(INFORMATIKA_UPNVJT_KODE)!;
    const target = toSnbtTarget(prodi)!;

    // Mode rata-rata langsung
    const resAverage = predictSnbt(
      { mode: "average", averageScore: target.skor_acuan },
      target
    );
    expect(resAverage.userScore).toBe(target.skor_acuan);
    expect(resAverage.delta).toBe(0);
    expect(resAverage.probability).toBe(50);
    expect(resAverage.status).toBe("target");
    expect(resAverage.isUncertain).toBe(false);
    expect(resAverage.sensitivityDelta).toBe(APP_CONFIG.sensitivity.snbt);
    expect(resAverage.pLow).toBeLessThan(resAverage.probability);
    expect(resAverage.pHigh).toBeGreaterThan(resAverage.probability);

    // Mode 7 subtes yang rata-ratanya sama dengan skor_acuan
    const resSubtests = predictSnbt(
      {
        mode: "subtests",
        subtests: [
          target.skor_acuan - 30,
          target.skor_acuan - 20,
          target.skor_acuan - 10,
          target.skor_acuan,
          target.skor_acuan + 10,
          target.skor_acuan + 20,
          target.skor_acuan + 30,
        ],
      },
      target
    );
    expect(resSubtests.probability).toBe(50);
    expect(resSubtests.userScore).toBe(target.skor_acuan);
  });

  it("memvalidasi jumlah 7 subtes pada mode subtests", () => {
    expect(() =>
      calculateSnbtUserScore({ mode: "subtests", subtests: [600, 600, 600] })
    ).toThrow();
  });

  it("memperbesar delta sensitivitas saat is_new === 1 atau jumlah_tahun_histori < 3", () => {
    const normal = predictSnbt(
      { mode: "average", averageScore: 600 },
      { skor_acuan: 600, is_new: 0, jumlah_tahun_histori: 3 }
    );
    const prodiBaru = predictSnbt(
      { mode: "average", averageScore: 600 },
      { skor_acuan: 600, is_new: 1, jumlah_tahun_histori: 3 }
    );
    const historiKurang = predictSnbt(
      { mode: "average", averageScore: 600 },
      { skor_acuan: 600, is_new: 0, jumlah_tahun_histori: 2 }
    );

    expect(normal.isUncertain).toBe(false);
    expect(normal.sensitivityDelta).toBe(15);

    expect(prodiBaru.isUncertain).toBe(true);
    expect(prodiBaru.sensitivityDelta).toBe(25);
    expect(prodiBaru.pLow).toBeLessThan(normal.pLow);
    expect(prodiBaru.pHigh).toBeGreaterThan(normal.pHigh);

    expect(historiKurang.isUncertain).toBe(true);
    expect(historiKurang.sensitivityDelta).toBe(25);
    expect(historiKurang.pLow).toBe(prodiBaru.pLow);
    expect(historiKurang.pHigh).toBe(prodiBaru.pHigh);
  });
});

describe("SNBP Prediction Engine (F2.B)", () => {
  it("menghasilkan skor komposit terkalibrasi (85.8) untuk akreditasi A, tanpa alumni, tanpa prestasi dengan rapor & mapel 86", () => {
    const score = calculateSnbpCompositeScore({
      raporAverage: 86,
      mapelPendukungAverage: 86,
      akreditasi: "A",
      hasAlumni: false,
      prestasi: "tidak_ada",
    });

    // 0.50*86 + 0.20*86 + 0.20*86 + 0.10*84 = 43 + 17.2 + 17.2 + 8.4 = 85.8
    expect(score).toBe(85.8);
    expect(score).toBeGreaterThanOrEqual(85);
  });

  it("menghasilkan P tepat 50% saat S_snbp == rapor_acuan (INFORMATIKA UPNVJT 13851006)", () => {
    const prodi = findProdiByKode(INFORMATIKA_UPNVJT_KODE)!;
    const target = toSnbpTarget(prodi)!;

    // Cari nilai rapor & mapel yang menghasilkan S_snbp persis = rapor_acuan
    // S_snbp = 0.70 * x + 0.20 * 86 + 0.10 * 84 = 0.70 * x + 25.6
    // => x = (rapor_acuan - 25.6) / 0.70
    const x = (target.rapor_acuan - 25.6) / 0.7;
    const res = predictSnbp(
      {
        raporAverage: x,
        mapelPendukungAverage: x,
        akreditasi: "A",
        hasAlumni: false,
        prestasi: "tidak_ada",
      },
      target
    );

    expect(res.userScore).toBe(target.rapor_acuan);
    expect(res.delta).toBe(0);
    expect(res.probability).toBe(50);
    expect(res.status).toBe("target");
    expect(res.pLow).toBeLessThan(res.probability);
    expect(res.pHigh).toBeGreaterThan(res.probability);
  });

  it("memperhitungkan status alumni secara terpisah dan memperbesar delta saat histori < 3 atau prodi baru", () => {
    const targetNormal = {
      rapor_acuan: 87.5,
      is_new: 0 as const,
      jumlah_tahun_histori: 3,
    };
    const targetUncertain = {
      rapor_acuan: 87.5,
      is_new: 0 as const,
      jumlah_tahun_histori: 1,
    };

    const denganAlumni = predictSnbp(
      {
        raporAverage: 88,
        mapelPendukungAverage: 88,
        akreditasi: "A",
        hasAlumni: true,
        prestasi: "tidak_ada",
      },
      targetNormal
    );
    const tanpaAlumni = predictSnbp(
      {
        raporAverage: 88,
        mapelPendukungAverage: 88,
        akreditasi: "A",
        hasAlumni: false,
        prestasi: "tidak_ada",
      },
      targetNormal
    );

    // Selisih SkorSekolahAlumni A (94 - 86 = 8) * bobot 0.20 = 1.6 poin komposit
    expect(denganAlumni.userScore - tanpaAlumni.userScore).toBeCloseTo(1.6, 2);
    expect(denganAlumni.probability).toBeGreaterThan(tanpaAlumni.probability);

    const uncertainRes = predictSnbp(
      {
        raporAverage: 88,
        mapelPendukungAverage: 88,
        akreditasi: "A",
        hasAlumni: false,
        prestasi: "tidak_ada",
      },
      targetUncertain
    );
    expect(uncertainRes.isUncertain).toBe(true);
    expect(uncertainRes.sensitivityDelta).toBe(APP_CONFIG.sensitivity.snbpUncertain);
    expect(uncertainRes.pLow).toBeLessThan(tanpaAlumni.pLow);
    expect(uncertainRes.pHigh).toBeGreaterThan(tanpaAlumni.pHigh);
  });
});

describe("Smart Alternative Recommender (F5)", () => {
  it("mengurutkan kandidat safe berdasarkan skor_acuan menurun, maks 3, dan mengecualikan Pilihan 1 & 2", () => {
    const mockDataset: ProdiIndexItem[] = [
      makeProdi({ kode_prodi: "P1", snbt: { tersedia: true, skor_acuan: 700, jumlah_tahun_histori: 3 } }),
      makeProdi({ kode_prodi: "P2", snbt: { tersedia: true, skor_acuan: 610, jumlah_tahun_histori: 3 } }),
      // Kandidat safe (userScore = 660; butuh skor_acuan <= 660 - ln(3)/0.025 = 616.05)
      makeProdi({ kode_prodi: "SAFE_LOW", snbt: { tersedia: true, skor_acuan: 550, jumlah_tahun_histori: 3 } }),
      makeProdi({ kode_prodi: "SAFE_HIGH", snbt: { tersedia: true, skor_acuan: 615, jumlah_tahun_histori: 3 } }),
      makeProdi({ kode_prodi: "SAFE_MID1", snbt: { tersedia: true, skor_acuan: 600, jumlah_tahun_histori: 3 } }),
      makeProdi({ kode_prodi: "SAFE_MID2", snbt: { tersedia: true, skor_acuan: 585, jumlah_tahun_histori: 3 } }),
      // Beda rumpun (harus diabaikan)
      makeProdi({
        kode_prodi: "BEDA_RUMPUN",
        rumpun: "Ekonomi & Bisnis",
        snbt: { tersedia: true, skor_acuan: 614, jumlah_tahun_histori: 3 },
      }),
      // Tidak tersedia di SNBT (harus diabaikan)
      makeProdi({
        kode_prodi: "TIDAK_TERSEDIA",
        snbt: { tersedia: false },
      }),
    ];

    const recs = recommendAlternatives({
      jalur: "snbt",
      userInput: { mode: "average", averageScore: 660 },
      pilihan1Kode: "P1",
      pilihan2Kode: "P2",
      dataset: mockDataset,
    });

    expect(recs).toHaveLength(3);
    expect(recs.map((r) => r.prodi.kode_prodi)).toEqual([
      "SAFE_HIGH",
      "SAFE_MID1",
      "SAFE_MID2",
    ]);
    expect(recs.every((r) => r.prediction.status === "safe")).toBe(true);
    expect(recs.some((r) => r.prodi.kode_prodi === "P1" || r.prodi.kode_prodi === "P2")).toBe(false);
  });

  it("melengkapi dari kandidat target (urut P menurun) saat kandidat safe kurang dari 3, dan mengabaikan reach", () => {
    // userScore = 600;
    // safe threshold: skor_acuan <= 556.05
    // target range: 556.06 .. 600
    // reach: > 600
    const mockDataset: ProdiIndexItem[] = [
      makeProdi({ kode_prodi: "P1", snbt: { tersedia: true, skor_acuan: 680, jumlah_tahun_histori: 3 } }),
      makeProdi({ kode_prodi: "SAFE_1", snbt: { tersedia: true, skor_acuan: 550, jumlah_tahun_histori: 3 } }),
      makeProdi({ kode_prodi: "TARGET_LOWER_P", snbt: { tersedia: true, skor_acuan: 595, jumlah_tahun_histori: 3 } }),
      makeProdi({ kode_prodi: "TARGET_HIGHER_P", snbt: { tersedia: true, skor_acuan: 565, jumlah_tahun_histori: 3 } }),
      makeProdi({ kode_prodi: "TARGET_MID_P", snbt: { tersedia: true, skor_acuan: 580, jumlah_tahun_histori: 3 } }),
      makeProdi({ kode_prodi: "REACH_ONLY", snbt: { tersedia: true, skor_acuan: 620, jumlah_tahun_histori: 3 } }),
    ];

    const recs = recommendAlternatives({
      jalur: "snbt",
      userInput: { mode: "average", averageScore: 600 },
      pilihan1Kode: "P1",
      dataset: mockDataset,
    });

    expect(recs).toHaveLength(3);
    expect(recs.map((r) => r.prodi.kode_prodi)).toEqual([
      "SAFE_1",
      "TARGET_HIGHER_P",
      "TARGET_MID_P",
    ]);
    expect(recs[0].prediction.status).toBe("safe");
    expect(recs[1].prediction.status).toBe("target");
    expect(recs[2].prediction.status).toBe("target");
    expect(recs[1].prediction.probability).toBeGreaterThan(
      recs[2].prediction.probability
    );
  });

  it("menerapkan aturan alumni SNBP: PTN sama dengan Pilihan 1 pakai input user, PTN berbeda default Tidak Ada", () => {
    // Akreditasi A, rapor 88, mapel 88, prestasi tidak_ada (84):
    // - hasAlumni = true  -> 0.5*88 + 0.2*88 + 0.2*94 + 0.1*84 = 88.8
    // - hasAlumni = false -> 0.5*88 + 0.2*88 + 0.2*86 + 0.1*84 = 87.2
    const mockDataset: ProdiIndexItem[] = [
      makeProdi({
        kode_prodi: "P1",
        id_ptn: 385,
        snbp: { tersedia: true, rapor_acuan: 91.0, jumlah_tahun_histori: 3 },
      }),
      makeProdi({
        kode_prodi: "SAME_PTN",
        id_ptn: 385,
        snbp: { tersedia: true, rapor_acuan: 87.5, jumlah_tahun_histori: 3 },
      }),
      makeProdi({
        kode_prodi: "OTHER_PTN",
        id_ptn: 382,
        nama_ptn: "INSTITUT TEKNOLOGI SEPULUH NOPEMBER",
        snbp: { tersedia: true, rapor_acuan: 87.5, jumlah_tahun_histori: 3 },
      }),
    ];

    const recs = recommendAlternatives({
      jalur: "snbp",
      userInput: {
        raporAverage: 88,
        mapelPendukungAverage: 88,
        akreditasi: "A",
        hasAlumni: true,
        prestasi: "tidak_ada",
      },
      pilihan1Kode: "P1",
      dataset: mockDataset,
    });

    // SAME_PTN mendapat userScore 88.8 (> 87.5 -> target, P ~64.8%)
    // OTHER_PTN mendapat userScore 87.2 (< 87.5 -> reach, P ~46.5%, sehingga TIDAK masuk rekomendasi!)
    expect(recs).toHaveLength(1);
    expect(recs[0].prodi.kode_prodi).toBe("SAME_PTN");
    expect(recs[0].prediction.userScore).toBe(88.8);
    expect(recs[0].prediction.status).toBe("target");

    // Verifikasi langsung bila OTHER_PTN punya rapor_acuan 86.0 (masuk target) bahwa userScore-nya tetap 87.2 (tanpa alumni)
    const mockDataset2: ProdiIndexItem[] = [
      mockDataset[0],
      makeProdi({
        kode_prodi: "OTHER_PTN_TARGET",
        id_ptn: 382,
        snbp: { tersedia: true, rapor_acuan: 86.0, jumlah_tahun_histori: 3 },
      }),
    ];
    const recs2 = recommendAlternatives({
      jalur: "snbp",
      userInput: {
        raporAverage: 88,
        mapelPendukungAverage: 88,
        akreditasi: "A",
        hasAlumni: true,
        prestasi: "tidak_ada",
      },
      pilihan1Kode: "P1",
      dataset: mockDataset2,
    });
    expect(recs2).toHaveLength(1);
    expect(recs2[0].prediction.userScore).toBe(87.2);
  });

  it("mengembalikan array kosong jika tidak ada kandidat yang memenuhi atau Pilihan 1 tidak ditemukan", () => {
    expect(
      recommendAlternatives({
        jalur: "snbt",
        userInput: { mode: "average", averageScore: 300 },
        pilihan1Kode: "KODE_TIDAK_ADA",
      })
    ).toEqual([]);

    const recsLowScore = recommendAlternatives({
      jalur: "snbt",
      userInput: { mode: "average", averageScore: 200 },
      pilihan1Kode: INFORMATIKA_UPNVJT_KODE,
    });
    expect(recsLowScore).toEqual([]);
  });

  it("bekerja mulus pada dataset nyata data/index.json untuk INFORMATIKA UPNVJT (13851006)", () => {
    const recs = recommendAlternatives({
      jalur: "snbt",
      userInput: { mode: "average", averageScore: 630 },
      pilihan1Kode: INFORMATIKA_UPNVJT_KODE,
      pilihan2Kode: "13851007",
    });

    expect(recs.length).toBeGreaterThan(0);
    expect(recs.length).toBeLessThanOrEqual(APP_CONFIG.recommender.maxAlternatives);
    expect(recs.every((r) => r.prodi.rumpun === "Komputer & IT")).toBe(true);
    expect(
      recs.every(
        (r) =>
          r.prodi.kode_prodi !== INFORMATIKA_UPNVJT_KODE &&
          r.prodi.kode_prodi !== "13851007"
      )
    ).toBe(true);
  });
});

describe("Target Score Calculator (calculateRequiredScore)", () => {
  it("menghitung skor target SNBT 75% (+43.94 poin di atas acuan) dan gap dengan akurat", () => {
    const res = calculateRequiredScore({
      jalur: "snbt",
      referenceScore: 584.1,
      userScore: 600,
      targetProbability: 75,
    });
    expect(res.targetProbability).toBe(75);
    expect(res.requiredScore).toBeCloseTo(584.1 + Math.log(3) / 0.025, 1);
    expect(res.gap).toBeCloseTo(res.requiredScore - 600, 1);
    expect(res.isOutOfScale).toBe(false);
    expect(res.acuanDibatasi).toBeNull();
  });

  it("menghasilkan gap = 0 ketika skor pengguna sudah memenuhi target", () => {
    const res = calculateRequiredScore({
      jalur: "snbt",
      referenceScore: 584.1,
      userScore: 650,
      targetProbability: 75,
    });
    expect(res.gap).toBe(0);
    expect(res.isOutOfScale).toBe(false);
  });

  it("menandai isOutOfScale = true jika target melewati skala maksimum dan meneruskan acuanDibatasi", () => {
    const snbtOver = calculateRequiredScore({
      jalur: "snbt",
      referenceScore: 980,
      userScore: 700,
      targetProbability: 75,
      acuanDibatasi: "atas",
    });
    expect(snbtOver.isOutOfScale).toBe(true);
    expect(snbtOver.acuanDibatasi).toBe("atas");

    const snbpOver = calculateRequiredScore({
      jalur: "snbp",
      referenceScore: 96,
      userScore: 90,
      targetProbability: 90,
      acuanDibatasi: "atas",
    });
    expect(snbpOver.isOutOfScale).toBe(true);
    expect(snbpOver.acuanDibatasi).toBe("atas");

    const snbtLowerClamp = calculateRequiredScore({
      jalur: "snbt",
      referenceScore: 460,
      userScore: 470,
      targetProbability: 75,
      acuanDibatasi: "bawah",
    });
    expect(snbtLowerClamp.isOutOfScale).toBe(false);
    expect(snbtLowerClamp.acuanDibatasi).toBe("bawah");
  });
});
