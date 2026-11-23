/**
 * Konstanta bisnis terpusat LolosPTN.AI (PRD MVP v1.2.1 — Bagian 5: F2, F4, F5).
 * Satu sumber kebenaran untuk koefisien sigmoid, sensitivitas, bobot SNBP,
 * ambang status, recommender F5, dan rate limit default.
 */

export type Jalur = "snbt" | "snbp";

export type StatusKategori = "safe" | "target" | "reach";

export type Akreditasi = "A" | "B" | "C";

export type PrestasiLevel = "nasional" | "provinsi" | "kabupaten" | "tidak_ada";

export type MetricEvent =
  | "sesi_selesai"
  | "klik_paywall"
  | "klik_wa"
  | "klik_fd_tabel"
  | "klik_fd_simulator"
  | "klik_fd_ai";

export const APP_CONFIG = {
  /** Koefisien kurva sigmoid P = 100 / (1 + exp(-k * delta)) */
  sigmoid: {
    k_snbt: 0.025,
    k_snbp: 0.47,
  },

  /** Delta rentang sensitivitas (heuristik, bukan interval kepercayaan statistik) */
  sensitivity: {
    snbt: 15,
    snbtUncertain: 25,
    snbp: 1.0,
    snbpUncertain: 1.8,
    minHistoriYears: 3,
  },

  /** Bobot skor komposit SNBP (total = 1.00) */
  snbpWeights: {
    rapor: 0.50,
    mapel: 0.20,
    sekolahAlumni: 0.20,
    prestasi: 0.10,
  },

  /** Tabel mapping SkorSekolahAlumni berdasarkan akreditasi & rekam jejak alumni per PTN */
  skorSekolahAlumni: {
    A: { ada: 94, tidakAda: 86 },
    B: { ada: 88, tidakAda: 81 },
    C: { ada: 82, tidakAda: 75 },
  },

  /** Tabel mapping SkorPrestasi berdasarkan tingkat prestasi tertinggi */
  skorPrestasi: {
    nasional: 98,
    provinsi: 92,
    kabupaten: 88,
    tidak_ada: 84,
  },

  /** Ambang kategori status tunggal yang dipakai F2 dan F5 (dalam persen 0-100) */
  statusThresholds: {
    safe: 75,
    target: 50,
  },

  /** Konfigurasi Smart Alternative Recommender (F5) */
  recommender: {
    maxAlternatives: 3,
  },

  /** Konfigurasi default rate limit server (F4 & /api/recommend) */
  rateLimit: {
    maxRequests: 5,
    windowSeconds: 600,
    recommendMaxRequests: 20,
  },

  /** Batas clamp skor/rapor acuan dari pipeline sync_snpmb.py */
  acuanClamp: {
    snbt: { min: 460, max: 760 },
    snbp: { min: 78, max: 96 },
  },

  /** Batas validasi input pengguna (F1) */
  inputBounds: {
    snbt: {
      min: 200,
      max: 1000,
      subtestCount: 7,
    },
    snbp: {
      min: 0,
      max: 100,
    },
  },

  /** Mode paywall: set `isBetaMode: false` saat QRIS berbayar siap diaktifkan */
  paywall: {
    isBetaMode: true,
  },

  /** Tautan eksternal (mudah diganti tanpa menyentuh komponen UI) */
  externalLinks: {
    whatsappAdminUrl:
      "https://wa.me/628xxxxxxxxxx?text=Halo%20Admin%20LolosPTN.AI%2C%20saya%20sudah%20transfer%20QRIS%20Rp10.000%20dan%20ingin%20konfirmasi%20kode%20akses.",
    feedbackFormUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLScq31vXB_Gd4R1Gk9FWt4m5w62t8zAyeSF8huUw4h1UCNnZGQ/viewform",
  },
} as const;
