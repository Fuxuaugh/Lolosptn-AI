/**
 * Semua teks UI LolosPTN.AI (Bahasa Indonesia) — PRD Bagian 7.4.
 * Komponen tidak boleh berisi string UI; ambil dari objek ini.
 */

export const copy = {
  meta: {
    title: "LolosPTN.AI — Hitung Peluang & Strategi SNBP/SNBT PTN Jawa Timur",
    description:
      "Simulasikan peluang lolos SNBP & SNBT di PTN Jawa Timur berbasis data historis SNPMB, lengkap dengan analisis strategi AI dan rekomendasi prodi alternatif aman.",
    kalkulatorTitle: "Kalkulator Peluang SNBP & SNBT — LolosPTN.AI",
    kalkulatorDescription:
      "Hitung peluang diterima SNBP & SNBT di 17 PTN Jawa Timur lengkap dengan tren historis, rekomendasi prodi alternatif, dan Strategi Pilihan AI.",
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

  nav: {
    brandInitial: "L",
    betaBadge: "BETA",
    links: {
      keunggulan: "Keunggulan",
      kalkulator: "Kalkulator",
      faq: "FAQ",
    },
    cta: "Cek Peluang",
  },

  hero: {
    brand: "LolosPTN.AI",
    pill: "Data Historis SNPMB • SNBP & SNBT",
    title: "Jangan Asal Pilih PTN. Hitung Peluang & Strategimu.",
    subtitle:
      "Simulasikan peluang lolos SNBP & SNBT di 17 PTN Jawa Timur berbasis data daya tampung dan peminat resmi SNPMB — lengkap dengan analisis strategi AI & rekomendasi prodi aman.",
    cta: "Cek Peluang Gratis",
    trustNote: "Tanpa login • Data pribadi tidak disimpan • 17 PTN Jatim & 740 Prodi",
    badgeFree: "Gratis • Tanpa daftar • Data pribadi tidak disimpan",
    preview: {
      header: "CONTOH HASIL SIMULASI • SNBT",
      scoreChip: "Skor UTBK 618",
      choice1Eyebrow: "PILIHAN 1",
      choice1Name: "Teknik Informatika — ITS",
      choice1Percent: "57,55%",
      choice1Range: "Rentang 48% – 66%",
      choice2Eyebrow: "PILIHAN 2",
      choice2Name: "Informatika — UPN Jatim",
      choice2Percent: "89,51%",
      choice2Range: "Rentang 84% – 93%",
      footerStrip: "Termasuk Strategi AI & Alternatif Prodi",
    },
  },

  bento: {
    eyebrow: "KEUNGGULAN UTAMA",
    title: "Kenapa Pakai LolosPTN.AI?",
    subtitle:
      "Dirancang agar kamu menentukan pilihan PTN dengan data terukur, bukan sekadar ikut-ikutan.",
    items: [
      {
        id: "data",
        accent: "blue" as const,
        title: "Berbasis Data Historis SNPMB",
        description:
          "Peluang dihitung deterministik dari rasio daya tampung & peminat tertimbang 3 tahun terakhir — transparan beserta rentang sensitivitasnya.",
        tag: "17 PTN Jatim • 740 Prodi",
      },
      {
        id: "ai",
        accent: "yellow" as const,
        title: "Strategi Pilihan AI",
        description:
          "Evaluasi tajam atas urutan pilihan, risiko persaingan, target kenaikan skor, hingga catatan validasi nilai TKA untuk jalur SNBP terbaru.",
        tag: "Urutan • Risiko • Konteks TKA",
      },
      {
        id: "alt",
        accent: "green" as const,
        title: "Rekomendasi Prodi Alternatif Aman",
        description:
          "Otomatis menemukan hingga 3 prodi serumpun berstatus Aman atau Moderat di PTN Jawa Timur agar strategi pilihanmu punya jaring pengaman.",
        tag: "3 Opsi Pengaman Serumpun",
      },
    ],
  },

  calcSection: {
    eyebrow: "SIMULASI & STRATEGI",
    title: "Kalkulator Peluang & Kartu Hasil",
    subtitle:
      "Pilih jalur seleksi, masukkan skor atau rapor, lalu cek peluang beserta analisis strategi AI.",
    emptyStateTitle: "Siap Menghitung Peluangmu?",
    emptyStateBody:
      "Isi Pilihan 1 (dan Pilihan 2 opsional) beserta skor UTBK atau nilai rapormu di samping, lalu klik \"Hitung Peluang Saya\". Kartu hasil siap screenshot akan langsung muncul di sini.",
  },

  form: {
    title: "Data Pilihan & Nilaimu",
    jalurLabel: "Pilih jalur seleksi",
    jalur: {
      snbt: "SNBT",
      snbp: "SNBP",
    },
    pilihan1: "Pilihan 1",
    pilihan2: "Pilihan 2",
    pilihan2OptionalHint:
      "Opsional — kosongkan jika hanya ingin menghitung 1 pilihan.",
    ptnLabel: "PTN",
    ptnPlaceholder: "Pilih PTN",
    ptnSearch: "Cari nama PTN…",
    prodiLabel: "Program Studi",
    prodiPlaceholder: "Pilih program studi",
    prodiSearch: "Cari nama prodi…",
    prodiDisabledHint: "Pilih PTN terlebih dahulu.",
    submit: "Hitung Peluang Saya",
    reset: "Atur Ulang",

    snbt: {
      sectionTitle: "Skor UTBK",
      modeSubtests: "Isi 7 Subtes",
      modeAverage: "Rata-rata Langsung",
      averageLabel: "Rata-rata skor UTBK",
      averageHelper: "Rentang 200–1000.",
      subtestsHelper:
        "Isi skor tiap subtes (200–1000). Rata-rata dihitung otomatis.",
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
      switchSnbpHint:
        "Pindah ke tab SNBP untuk input rapor, 2 mapel pendukung, akreditasi, alumni per PTN & konteks TKA.",
    },

    snbp: {
      sectionTitle: "Data Rapor & Sekolah",
      eligibility: {
        question:
          "Apakah sekolahmu dan kamu masuk daftar eligible SNBP tahun ini?",
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
      alumniHelper:
        "Apakah ada kakak kelas dari sekolahmu yang diterima di PTN ini lewat SNBP?",
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
      range: (min: number, max: number) =>
        `Nilai harus di antara ${min} dan ${max}.`,
      selectPtn: "Pilih PTN terlebih dahulu.",
      selectProdi: "Pilih program studi.",
      sameProdi: "Pilihan 1 dan Pilihan 2 tidak boleh prodi yang sama.",
      eligibilityRequired: "Jawab pertanyaan eligibilitas SNBP terlebih dahulu.",
    },
  },

  hasil: {
    title: "Hasil Peluangmu",
    shareableTag: "Siap Screenshot",
    peluangLabel: "Peluang diterima",
    peluang: (p: string) => `${p}%`,
    rentangSensitivitas: (low: string, high: string) =>
      `Rentang sensitivitas: ${low}% – ${high}%`,
    rentangSensitivitasNote:
      "Rentang ini menunjukkan sensitivitas terhadap ketidakpastian skor acuan, bukan jaminan statistik.",
    uncertainNote:
      "Prodi baru atau data historis kurang dari 3 tahun, sehingga rentang sensitivitas diperlebar.",
    skorKamu: "Skor UTBK",
    skorAcuan: "Acuan estimasi",
    raporKamu: "Komposit SNBP",
    raporAcuan: "Acuan estimasi",
    selisih: "Selisih",
    kuotaTerbaru: "Kuota tahun ini",
    kuotaUnavailable: "Belum tersedia",
    portofolio: "Portofolio",
    pilihanBadge: (slot: number) => `PILIHAN ${slot}`,
    lihatMetodologi: "Lihat Metodologi",
    hitungUlang: "Hitung Ulang",
    legend: {
      safe: "Aman ≥ 75%",
      target: "Moderat 50–74%",
      reach: "Spekulatif < 50%",
    },
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
      description:
        "Peluang di bawah 50%. Butuh peningkatan skor atau strategi cadangan.",
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
    title: "DISCLAIMER & PRIVASI",
    body:
      "SNPMB tidak mengumumkan passing grade resmi. Data ini adalah estimasi statistik berdasarkan tren daya tampung & peminat SNPMB dan dapat berubah. Gunakan sebagai acuan strategi, bukan patokan mutlak.",
    privacyTitle: "Privasi",
    privacy:
      "Data pribadimu tidak disimpan: kami tidak meminta nama, NISN, email, maupun asal sekolah; hanya angka nilai dan pilihan prodi yang diproses.",
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
    beta: {
      headerTitle: "MODE AKSES BETA GRATIS",
      headerChip: "Tanpa Biaya • 1 Menit",
      unlockButton: "Buka Analisis Lengkap (Gratis Beta)",
      modalTitle: "Mode Akses Beta Gratis",
      intro:
        "Selama masa Beta, kamu bisa membuka 3 rekomendasi prodi alternatif dan Strategi dari AI secara gratis cukup dengan mengisi kuesioner singkat 1 menit.",
      step1:
        "1. Isi kuesioner 1 menit berikut untuk mendapatkan kode akses di pesan konfirmasi setelah submit.",
      questionnaireButton: "Isi Kuesioner 1 Menit & Ambil Kode Akses Gratis",
      step2:
        "2. Masukkan kode akses yang muncul di pesan konfirmasi kuesioner di bawah ini.",
    },
    qrisAlt: "Kode QRIS pembayaran",
    qrisPlaceholderTitle: "Placeholder QRIS Rp10.000",
    qrisPlaceholderNote: "Ganti di public/qris.png",
    whatsappButton: "Konfirmasi via WhatsApp Admin",
    codeLabel: "Kode akses",
    codePlaceholder: "Masukkan kode akses Beta…",
    codeHelper: "Kode akses hanya disimpan di memori halaman selama sesi ini.",
    codeRequired: "Masukkan kode akses terlebih dahulu.",
    codeSubmit: "Buka Analisis",
    submitting: "Memverifikasi kode & menyiapkan analisis…",
    screenshotReminderTitle: "Pengingat",
    screenshotReminder:
      "Simpan atau screenshot hasil analisis ini sebelum menutup halaman.",
    unlockedTitle: "Analisis Lengkap",
    cachedBadge: "Dimuat dari cache (kuota kode tidak berkurang)",
    alternativesTitle: "Rekomendasi Prodi Alternatif Serumpun",
    alternativesSubtitle:
      "Pilihan prodi di rumpun yang sama dengan Pilihan 1 yang paling realistis untuk posisimu.",
    aiTitle: "Strategi dari AI",
    aiChip: "Strategi Pilihan AI",
    aiSubtitle: "Ringkasan strategi berdasarkan angka hasil perhitunganmu.",
    refScoreShort: (jalur: "snbt" | "snbp", value: number) =>
      jalur === "snbt" ? `Skor acuan: ${value}` : `Nilai acuan: ${value}`,
  },

  faq: {
    eyebrow: "TANYA JAWAB & TRANSPARANSI",
    title: "Pertanyaan yang Sering Ditanyakan",
    items: [
      {
        id: "cara-hitung",
        question: "Bagaimana cara LolosPTN.AI menghitung peluang diterima?",
        answer:
          "Seluruh peluang dihitung deterministik (bukan ditebak AI) dari rasio daya tampung dibanding peminat 3 tahun terakhir yang dibobotkan (50% tahun terbaru, 30%, 20%), dipetakan ke distribusi normal, lalu diubah ke persentase peluang dengan kurva sigmoid beserta rentang sensitivitasnya.",
      },
      {
        id: "tka-snbp",
        question:
          "Bagaimana pengaruh TKA (Tes Kemampuan Akademik) pada jalur SNBP terbaru?",
        answer:
          "Sesuai ketentuan SNPMB terbaru, selain konsistensi nilai rapor, pengisian PDSS, indeks sekolah, dan rekam jejak alumni, kelulusan SNBP juga dipengaruhi validasi nilai TKA (Tes Kemampuan Akademik). Analisis Strategi AI untuk SNBP akan menyoroti hal ini sebagai pengingat persiapanmu.",
      },
      {
        id: "bukan-snpmb",
        question:
          "Apakah angka peluang ini merupakan pengumuman atau passing grade resmi SNPMB?",
        answer:
          "Bukan. Panitia SNPMB tidak pernah merilis passing grade resmi. Semua angka di LolosPTN.AI adalah estimasi statistik berbasis data historis daya tampung & peminat yang dipublikasikan, digunakan sebagai alat bantu strategi pemilihan prodi.",
      },
      {
        id: "privasi",
        question:
          "Apakah data rapor, skor UTBK, atau identitas pribadiku disimpan?",
        answer:
          "Tidak. Privasi terjaga dan data pribadimu tidak disimpan: kami tidak meminta nama, NISN, email, maupun asal sekolah. Hanya angka skor/nilai dan pilihan prodi yang diproses sementara untuk menampilkan hasilmu.",
      },
      {
        id: "beta-gratis",
        question: "Bagaimana cara mendapatkan kode akses Beta gratis?",
        answer:
          "Selama masa Beta, klik tombol \"Isi Kuesioner 1 Menit & Ambil Kode Akses Gratis\" di blok Mode Akses Beta Gratis. Setelah mengirim kuesioner, kode akses akan langsung tampil di pesan konfirmasi dan bisa langsung dipakai untuk membuka Strategi Pilihan AI & alternatif prodi.",
      },
    ],
  },

  closingCta: {
    eyebrow: "SIAP MULAI?",
    title: "Siap cek peluangmu sekarang?",
    subtitle:
      "Hitung peluang Pilihan 1 & 2 di 17 PTN Jawa Timur secara gratis tanpa login, lengkap dengan tren historis dan Strategi Pilihan AI.",
    button: "Buka Kalkulator Peluang",
  },

  feedback: {
    title: "Bantu Kalibrasi Data (Laporan Anonim)",
    body:
      "Sudah menerima hasil SNBP atau SNBT? Bagikan jalur, prodi, rentang nilai, dan status lolos/tidak secara anonim tanpa nama, kontak, atau asal sekolah.",
    cta: "Isi Laporan Hasil Anonim",
  },

  footer: {
    brandNote: "LolosPTN.AI • Beta MVP (17 PTN Jawa Timur)",
    tagline: "Dibuat untuk siswa SMA & gap year Indonesia",
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
    badRequest: "Data input tidak valid. Periksa kembali isianmu.",
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
    subtitle:
      "Hanya tersedia di mode development. Dipakai untuk mengecek dampak perubahan token.",
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
    cardBody:
      "Kartu memakai token surface, line, radius-card, dan shadow-card.",
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
