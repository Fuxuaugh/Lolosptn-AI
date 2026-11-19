# Progress LolosPTN.AI

- [x] M1: Init Next.js & Pipeline Data (`sync_snpmb.py`)
- [x] M2: Prediction Engine (`app.config.ts`, `prediction.ts` + Unit Test)
- [x] M3: Fondasi Desain P0 (`tokens.css`, `copy.ts`, `components/ui/`)
- [x] M4: Fitur Gratis (F1, F2, F3)
- [ ] M5: Backend Server (`redis.ts`, `/api/analyze`, `/api/metric`)
- [ ] M6: Paywall (F4), Integrasi F5-F6, & Build Deploy

## Catatan Cekpoin Terakhir

### M1 selesai (2026-11-20)

**File yang dibuat:**
- Proyek Next.js (`create-next-app`: App Router, TypeScript, Tailwind CSS, ESLint, `src/`, alias `@/*`, npm). Kode bawaan template belum diubah.
- `scripts/sync_snpmb.py`: pipeline PRD Bagian 4 (fetch → filter Jatim → gabung per `kode_prodi` → rasio tertimbang → Z-score/proxy score → offset kalibrasi → rumpun → tulis output). Output hanya ditulis jika semua fetch berhasil (snapshot lama tetap aman).
- `scripts/test_sync_snpmb.py`: 27 unit test (`unittest`), semua lulus. Jalankan: `python -m unittest scripts/test_sync_snpmb.py -v`.
- `data/kalibrasi.json`: 1 entri contoh `13851006` (`n_laporan: 0`, jadi offset belum aktif). Skrip hanya membaca file ini, tidak pernah menimpanya.
- `data/index.json`: `{ dataset_version, items[] }`, flat list 740 prodi tanpa historis.
- `public/data/ptn/{id_ptn}.json`: 17 file (detail + historis per PTN).

**Hasil verifikasi API & data:**
- Field kuota tahun berjalan: `daya_tampung_snbt` / `daya_tampung_snbp` (tipe string, dikonversi ke int). Historis ada di `history_daya_tampung`. `kode_prov1` ada di dalam array `provinsi[]` pada `proxy-ptn-sb.php`.
- 17 PTN Jatim, 740 prodi (SNBT 740, SNBP 740). Tahun historis: 2023–2025. 25 prodi `is_new`.
- 138 prodi jatuh ke fallback "Sains & Umum". Banyak di antaranya kandidat `rumpun_override`, misalnya `PG PAUD`, `PEND. GURU SEKOLAH DASAR`, prodi ternak/tanaman, `PARIWISATA`, `ILMU ADMINISTRASI NEGARA`, `KECERDASAN ARTIFISIAL`, `AKUAKULTUR`.

**Keputusan implementasi:**
- Per-PTN JSON disimpan di `public/data/ptn/` (bukan `data/ptn/` seperti di PRD Bagian 3) atas instruksi agar bisa di-fetch sebagai file statis.
- Historis = maksimal 3 tahun terakhir yang lengkap (daya_tampung & peminat > 0). Rasio per tahun di-clamp dulu, baru dibobotkan.
- Kata kunci rumpun dicocokkan sebagai substring nama prodi (setelah upper-case & spasi dirapikan). `AGRIBISNIS` ditambahkan eksplisit karena tidak mengandung `AGRO`.
- `is_new` tingkat prodi = 1 jika salah satu jalur `is_new == 1`. Rasio tiap jalur memakai `is_new` jalur itu sendiri.
- Menjalankan sync butuh akses jaringan ke snpmb.id.

### M2 selesai (2026-11-20)

**File yang dibuat / diperbarui:**
- `src/config/app.config.ts`: seluruh konstanta bisnis PRD Bagian 5 (sigmoid `k_snbt`/`k_snbp`, delta sensitivitas normal & uncertain, `minHistoriYears: 3`, bobot SNBP, tabel `skorSekolahAlumni` & `skorPrestasi`, ambang status tunggal `safe: 75` / `target: 50`, `maxAlternatives: 3`, rate limit `5 / 600s`, serta batas input F1).
- `src/lib/dataset.ts`: tipe TypeScript 100% selaras dengan skema `data/index.json` dan `public/data/ptn/{id_ptn}.json`, static import `data/index.json` (`DATASET_VERSION`, `DATASET_ITEMS`), helper `getPtnList`, `getProdiByJalur`, `findProdiByKode`, dan client-side `fetchPtnDetail(idPtn)`.
- `src/lib/prediction.ts`: pure logic tanpa styling/CSS (F2 & F5): `predictSnbt`, `predictSnbp`, `recommendAlternatives`, `calculateSnbtUserScore`, `calculateSnbpCompositeScore`, `getStatusFromProbability`, `toSnbtTarget`, `toSnbpTarget`.
- `src/lib/prediction.test.ts`: 13 unit test Vitest mencakup SNBT & SNBP pada INFORMATIKA UPNVJT (`13851006`), rentang sensitivitas (`is_new` & histori < 3), batas kategori status (`75%`, `50%`, `49.9%`), skor komposit SNBP terkalibrasi (`85.8`), dan seluruh aturan F5 Recommender (sorting safe/target, eksklusi Pil 1 & 2, aturan alumni per PTN).
- `vitest.config.ts` & `package.json`: pasang `vitest@3` (devDependency) dan tambah skrip `npm test`.

**Hasil verifikasi:**
- `npx vitest run --reporter=verbose`: 13/13 test lulus.
- `npx tsc --noEmit`: lulus (0 error).
- `npm run lint`: lulus (0 error, 0 warning).

### M3 selesai (2026-11-20)

**File yang dibuat / diperbarui:**
- `src/styles/tokens.css`: semantic CSS variables PRD Bagian 7.2 (`--color-*`, `--radius-*`, `--font-sans`, `--space-*`, warna status kontras WCAG AA, dan `@media (prefers-reduced-motion: reduce)`).
- `src/app/globals.css`: impor `tokens.css` dan pemetaan `@theme inline` untuk Tailwind v4 (`bg-surface`, `bg-surface-muted`, `text-fg`, `text-fg-muted`, `bg-brand`, `border-line`, `bg-status-safe`, `bg-status-target`, `bg-status-reach`, `bg-callout-bg`, `rounded-card`, `rounded-control`, dll.).
- `src/app/layout.tsx`: memuat font `Inter` (`next/font/google`) ke `--font-inter`, menerapkan `lang`, `data-theme`, metadata dari `theme.ts`, dan kelas token semantik.
- `src/config/theme.ts`: konfigurasi tema aktif (`light`), `brandName`, metadata dasar, `cardStyle`, dan `resultLayoutOrder: ["hasil", "tren", "callout", "paywall"]`.
- `src/config/copy.ts`: seluruh string UI Bahasa Indonesia terstruktur (`meta`, `common`, `hero`, `form` SNBT & SNBP termasuk cek eligibilitas, `hasil`, `status`, `tren`, `disclaimer` & privasi zero-PII, `metodologi`, `paywall`, `fallback`, `error`, `design`).
- `src/components/ui/`: 9 komponen primitif generik mobile-first (target sentuh min 44px, WCAG AA, tanpa hardcode warna/teks) + `cn.ts` & `index.ts`: `Button.tsx`, `Card.tsx`, `Badge.tsx` (ikon + label untuk `safe`/`target`/`reach`), `Modal.tsx` (close tombol, ESC, backdrop), `Tabs.tsx`, `Select.tsx` (searchable), `Callout.tsx`, `Input.tsx` (label, helper, error), `Skeleton.tsx`.
- `src/app/design/page.tsx` & `src/app/design/DesignGallery.tsx`: galeri komponen minimal dev-only (`notFound()` di production).

**Hasil verifikasi:**
- `npx tsc --noEmit`: lulus (0 error).
- `npm run lint`: lulus (0 error, 0 warning).
- `npm test`: 13/13 unit test M2 tetap lulus.

### M4 selesai (2026-11-20)

**File yang dibuat / diperbarui:**
- `src/components/features/PredictionForm.tsx`: form F1 Dual-Track (tab SNBT/SNBP, searchable dropdown PTN → Prodi Pilihan 1 wajib & Pilihan 2 opsional hanya `tersedia: true`, mode SNBT 7 subtes / rata-rata langsung 200–1000, mode SNBP cek eligibilitas + callout peringatan & tautan SNPMB, rapor 0–100, mapel 0–100, akreditasi A/B/C, prestasi, alumni terpisah untuk Pilihan 1 & 2, validasi lengkap).
- `src/components/features/HasilKartu.tsx`: kartu hasil F2 per pilihan (PTN, prodi, jenjang, `Badge` status, probabilitas titik, rentang sensitivitas `P_low`–`P_high` + catatan heuristik & `isUncertain`, skor vs acuan, kuota tahun berjalan, syarat portofolio).
- `src/components/features/TrenChart.tsx`: grafik batang SVG ringan memakai token CSS (`var(--color-*)`) + tabel Peminat vs Daya Tampung, memuat data via `fetchPtnDetail(idPtn)` dengan `Skeleton` loading & tombol retry.
- `src/components/features/MetodologiModal.tsx`: modal penjelasan metodologi (rasio diterima, persentil normal, koefisien sigmoid SNBT/SNBP, rentang sensitivitas heuristik, keterbatasan data SNPMB).
- `src/components/features/PaywallPreview.tsx`: placeholder terkunci (*blurred overlay*, tanpa data F5/F6 di klien) dengan tombol "Buka Analisis Lengkap (Rp10.000)".
- `src/components/features/HomeCalculator.tsx`, `src/components/features/index.ts`, & `src/app/page.tsx`: hero singkat + form + hasil sesuai urutan `THEME.resultLayoutOrder` (`["hasil", "tren", "callout", "paywall"]`) termasuk callout kuning disclaimer + privasi zero-PII & pemicu `MetodologiModal`.
- `src/config/copy.ts`: penambahan beberapa key teks UI untuk F1–F4 preview & detail koefisien metodologi.
- `src/lib/dataset.ts`: penambahan deduplikasi cache per sesi pada `fetchPtnDetail(idPtn)`.

**Hasil verifikasi:**
- `npx tsc --noEmit`: lulus (0 error).
- `npm run lint`: lulus (0 error, 0 warning).
- `npm test`: 13/13 unit test lulus.

**Berikutnya:** M5 (menunggu instruksi).
