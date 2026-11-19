/**
 * Semua teks UI LolosPTN.AI (Bahasa Indonesia) — PRD Bagian 7.4.
 * Komponen tidak boleh berisi string UI; ambil dari objek ini.
 * Teks dinamis ditulis sebagai fungsi kecil agar urutan kata tetap bisa diubah di sini.
 */

export const copy = {
  meta: {
    title: "LolosPTN.AI — Cek Peluang SNBP & SNBT PTN Jawa Timur",
    description:
      "Perkirakan peluang diterima di PTN Jawa Timur jalur SNBP dan SNBT secara transparan, lengkap dengan alternatif prodi yang realistis.",
  },

  /** Teks umum yang dipakai komponen primitif `ui/` */
  common: {
    close: "Tutup",
    cancel: "Batal",
    confirm: "Lanjutkan",
    loading: "Memuat…",
    selectPlaceholder: "Pilih salah satu",
    searchPlaceholder: "Ketik untuk mencari…",
    noResults: "Tidak ada hasil yang cocok.",
    resultCount: (n: number) => `${n} hasil`,
    clearSelection: "Hapus pilihan",
    required: "wajib",
    optional: "opsional",
  },

  hero: {
    brand: "LolosPTN.AI",
    title: "Seberapa besar peluangmu lolos PTN impian?",
    subtitle:
      "Hitung peluang SNBP & SNBT di seluruh PTN Jawa Timur berdasarkan tren daya tampung dan peminat resmi SNPMB.",
    cta: "Mulai Hitung Gratis",
    badgeFree: "Gratis • Tanpa daftar • Tanpa data pribadi",
  },

  form: {
    title: "Isi Data Pilihanmu",
    jalurLabel: "Pilih jalur seleksi",
    jalur: {
      snbt: "SNBT",
      snbp: "SNBP",
    },
    pilihan1: "Pilihan 1",
    pilihan2: "Pilihan 2",
    pilihan2OptionalHint: "Opsional — kosongkan jika hanya ingin menghitung 1 pilihan.",
    ptnLabel: "PTN",
    ptnPlaceholder: "Pilih PTN",
    ptnSearch: "Cari nama PTN…",
    prodiLabel: "Program Studi",
    prodiPlaceholder: "Pilih program studi",
    prodiSearch: "Cari nama prodi…",
    prodiDisabledHint: "Pilih PTN terlebih dahulu.",
    submit: "Hitung Peluang",
    reset: "Atur Ulang",

    snbt: {
      sectionTitle: "Skor UTBK",
      modeSubtests: "Isi 7 Subtes",
      modeAverage: "Input Rata-rata Langsung",
      averageLabel: "Rata-rata skor UTBK",
      averageHelper: "Rentang 200–1000.",
      subtestsHelper: "Isi skor tiap subtes (200–1000). Rata-rata dihitung otomatis.",
      subtests: [
        "Penalaran Umum (PU)",
        "Pengetahuan & Pemahaman Umum (PPU)",
        "Pemahaman Bacaan & Menulis (PBM)",
        "Pengetahuan Kuantitatif (PK)",
        "Literasi Bahasa Indonesia (LBI)",
        "Literasi Bahasa Inggris (LBE)",
        "Penalaran Matematika (PM)",
      ],
      averagePreview: (avg: string) => `Rata-rata sementara: ${avg}`,
    },

    snbp: {
      sectionTitle: "Data Rapor & Sekolah",
      eligibility: {
        question: "Apakah sekolahmu dan kamu masuk daftar eligible SNBP tahun ini?",
        yes: "Ya, sudah eligible",
        no: "Tidak / Belum tahu",
        warningTitle: "Pastikan status eligibilitasmu",
        warningBody:
          "Hanya siswa eligible yang dapat mendaftar SNBP. Tanyakan ke guru BK atau cek informasi resmi di situs SNPMB sebelum memakai hasil perhitungan ini.",
        officialLinkLabel: "Buka info resmi SNPMB",
        officialUrl: "https://snpmb.id",
      },
      raporLabel: "Rata-rata rapor semester 1–5",
      raporHelper: "Rentang 0–100.",
      mapelLabel: "Rata-rata 2 mapel pendukung jurusan",
      mapelHelper: "Rentang 0–100. Contoh: Matematika & Fisika untuk Teknik.",
      akreditasiLabel: "Akreditasi sekolah",
      akreditasi: { A: "A", B: "B", C: "C" },
      alumniLabel: (pilihan: string) => `Rekam jejak alumni di PTN ${pilihan}`,
      alumniHelper: "Apakah ada kakak kelas dari sekolahmu yang diterima di PTN ini lewat SNBP?",
      alumni: { ada: "Ada", tidakAda: "Tidak Ada" },
      prestasiLabel: "Prestasi tertinggi",
      prestasi: {
        nasional: "Nasional / Internasional",
        provinsi: "Provinsi",
        kabupaten: "Kabupaten / Kota",
        tidak_ada: "Tidak Ada",
      },
    },

    validation: {
      required: "Bagian ini wajib diisi.",
      notNumber: "Masukkan angka yang valid.",
      range: (min: number, max: number) => `Nilai harus di antara ${min} dan ${max}.`,
      selectPtn: "Pilih PTN terlebih dahulu.",
      selectProdi: "Pilih program studi.",
      sameProdi: "Pilihan 1 dan Pilihan 2 tidak boleh prodi yang sama.",
      eligibilityRequired: "Jawab pertanyaan eligibilitas SNBP terlebih dahulu.",
    },
  },

  hasil: {
    title: "Hasil Perkiraan Peluang",
    peluangLabel: "Peluang diterima",
    peluang: (p: string) => `${p}%`,
    rentangSensitivitas: (low: string, high: string) =>
      `Rentang sensitivitas: ${low}% – ${high}%`,
    rentangSensitivitasNote:
      "Rentang ini menunjukkan seberapa sensitif hasil terhadap ketidakpastian skor acuan, bukan jaminan statistik.",
    uncertainNote:
      "Prodi baru atau data historis kurang dari 3 tahun, sehingga rentang sensitivitas diperlebar.",
    skorKamu: "Skor kamu",
    skorAcuan: "Skor acuan (estimasi)",
    raporKamu: "Skor komposit kamu",
    raporAcuan: "Nilai acuan (estimasi)",
    selisih: "Selisih",
    kuotaTerbaru: "Daya tampung tahun ini",
    kuotaUnavailable: "Belum tersedia",
    portofolio: "Syarat portofolio",
    pilihanBadge: (slot: number) => `Pilihan ${slot}`,
    lihatMetodologi: "Lihat Metodologi",
    hitungUlang: "Hitung Ulang",
  },

  status: {
    safe: {
      label: "Aman",
      english: "Safety",
      description: "Peluang 75% ke atas. Pilihan yang relatif aman.",
    },
    target: {
      label: "Moderat",
      english: "Target",
      description: "Peluang 50%–74%. Realistis, tapi tetap ada persaingan.",
    },
    reach: {
      label: "Spekulatif",
      english: "Reach",
      description: "Peluang di bawah 50%. Butuh peningkatan skor atau strategi cadangan.",
    },
  },

  tren: {
    title: "Tren Peminat vs Daya Tampung",
    peminat: "Peminat",
    dayaTampung: "Daya Tampung",
    tahun: "Tahun",
    rasio: "Rasio diterima (tertimbang)",
    empty: "Belum ada data historis untuk prodi ini.",
    tableCaption: "Data historis SNPMB per tahun",
  },

  disclaimer: {
    title: "Perhatikan",
    body:
      "SNPMB tidak mengumumkan passing grade resmi. Data ini adalah estimasi statistik berdasarkan tren daya tampung & peminat SNPMB dan dapat berubah. Gunakan sebagai acuan strategi, bukan patokan mutlak.",
    privacyTitle: "Privasi",
    privacy:
      "Kami tidak menyimpan atau mengirim data identitas pribadi; hanya angka nilai dan pilihan prodi yang diproses.",
  },

  metodologi: {
    title: "Metodologi Perhitungan",
    intro:
      "Semua angka peluang dihitung secara deterministik dari data publik SNPMB, bukan oleh AI.",
    sections: [
      {
        heading: "1. Rasio diterima",
        body:
          "Rasio = daya tampung ÷ peminat per tahun, dirata-rata tertimbang (tahun terbaru 50%, sebelumnya 30%, dan 20%). Prodi baru memakai nilai bawaan 15%.",
      },
      {
        heading: "2. Pemetaan persentil normal",
        body:
          "Rasio diubah menjadi skor acuan dengan distribusi normal: makin kecil rasio diterima, makin tinggi skor acuan yang diperkirakan.",
      },
      {
        heading: "3. Kurva peluang (sigmoid)",
        body:
          "Selisih skor kamu dengan skor acuan diubah menjadi persentase peluang memakai fungsi logistik (koefisien k = 0,025 untuk SNBT dan k = 0,47 untuk SNBP). Skor sama dengan acuan berarti peluang tepat 50%.",
      },
      {
        heading: "4. Rentang sensitivitas",
        body:
          "Rentang dihitung dengan menggeser skor acuan naik dan turun (±15 poin SNBT / ±1,0 poin SNBP, atau ±25 / ±1,8 untuk prodi baru atau histori < 3 tahun). Ini heuristik untuk menunjukkan sensitivitas, bukan interval kepercayaan statistik.",
      },
      {
        heading: "5. Keterbatasan",
        body:
          "SNPMB tidak merilis data hasil per individu, sehingga perhitungan ini tidak bisa menjamin akurasi untuk setiap orang.",
      },
    ],
  },

  paywall: {
    lockedTitle: "Analisis Lengkap",
    lockedBody:
      "Dapatkan 3 alternatif prodi yang realistis dan strategi personal dari AI berdasarkan hasilmu.",
    unlockButton: "Buka Analisis Lengkap (Rp10.000)",
    modalTitle: "Buka Analisis Lengkap",
    step1: "1. Scan QRIS di bawah dan bayar Rp10.000.",
    step2: "2. Kirim bukti pembayaran ke admin via WhatsApp.",
    step3: "3. Masukkan kode akses yang kamu terima.",
    qrisAlt: "Kode QRIS pembayaran",
    whatsappButton: "Konfirmasi via WhatsApp",
    codeLabel: "Kode akses",
    codePlaceholder: "Contoh: LOLOS-XXXX",
    codeSubmit: "Buka Analisis",
    screenshotReminder:
      "Simpan atau screenshot hasil analisis ini sebelum menutup halaman.",
    alternativesTitle: "Alternatif Prodi yang Disarankan",
    aiTitle: "Strategi dari AI",
    previewNoticeTitle: "Segera Hadir",
    previewNoticeBody:
      "Pembayaran kode akses dan analisis lengkap (3 alternatif prodi + strategi AI) akan diaktifkan pada tahap berikutnya.",
  },

  fallback: {
    aiUnavailable: "Analisis AI sedang tidak tersedia",
    aiUnavailableBody:
      "Berikut ringkasan otomatis berdasarkan angka perhitunganmu. Kuota kode akses tidak dikurangi.",
    noAlternatives:
      "Belum ada alternatif yang cocok di rumpun yang sama. Coba pilihan prodi lain atau tingkatkan skormu.",
  },

  error: {
    generic: "Terjadi kesalahan. Silakan coba lagi.",
    network: "Koneksi bermasalah. Periksa internetmu lalu coba lagi.",
    datasetLoad: "Gagal memuat data PTN. Muat ulang halaman untuk mencoba lagi.",
    invalidCode: "Kode akses tidak valid.",
    codeExhausted: "Kode akses sudah mencapai batas pemakaian.",
    rateLimited: "Terlalu banyak permintaan. Coba lagi beberapa menit lagi.",
    retry: "Coba Lagi",
  },

  /** Teks galeri komponen /design (khusus development) */
  design: {
    title: "Galeri Komponen",
    subtitle: "Hanya tersedia di mode development. Dipakai untuk mengecek dampak perubahan token.",
    sections: {
      buttons: "Button",
      badges: "Badge Status",
      callouts: "Callout",
      cards: "Card",
      inputs: "Input",
      select: "Select (searchable)",
      tabs: "Tabs",
      modal: "Modal",
      skeleton: "Skeleton",
    },
    buttonPrimary: "Utama",
    buttonSecondary: "Sekunder",
    buttonGhost: "Ghost",
    buttonDisabled: "Nonaktif",
    buttonLoading: "Memuat",
    cardTitle: "Contoh Kartu",
    cardBody: "Kartu memakai token surface, line, radius-card, dan shadow-card.",
    inputSampleLabel: "Contoh input angka",
    inputErrorLabel: "Contoh input dengan galat",
    tabsPanel: (label: string) => `Konten panel ${label}.`,
    selectedValue: (v: string) => `Nilai terpilih: ${v}`,
    nothingSelected: "Belum ada yang dipilih.",
    openModal: "Buka Modal",
    modalBody: "Tutup dengan tombol, tombol ESC, atau klik di luar kotak.",
    infoCalloutTitle: "Info",
    infoCalloutBody: "Varian callout informasi netral.",
  },
} as const;

export type Copy = typeof copy;
