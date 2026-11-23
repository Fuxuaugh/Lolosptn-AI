# Progress LolosPTN.AI

- [x] M1: Init Next.js & Pipeline Data (`sync_snpmb.py`)
- [x] M2: Prediction Engine (`app.config.ts`, `prediction.ts` + Unit Test)
- [x] M3: Fondasi Desain P0 (`tokens.css`, `copy.ts`, `components/ui/`)
- [x] M4: Fitur Gratis (F1, F2, F3)
- [x] M5: Backend Server (`redis.ts`, `/api/analyze`, `/api/metric`)
- [x] M6: Paywall (F4), Integrasi F5-F6, & Build Deploy

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

### M5 selesai (2026-11-20)

**File yang dibuat / diperbarui:**
- `.env.example` & `.gitignore`: daftar seluruh env variable PRD Bagian 2 (`GEMINI_API_KEY`, `GEMINI_MODEL`, `ACCESS_CODES`, `ACCESS_CODE_MAX_USES`, `IP_HASH_SALT`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`); `.env.local` tetap diabaikan sementara `.env.example` di-unignore (`!.env.example`).
- `src/lib/redis.ts`: klien Upstash Redis REST API (berbasis `fetch` & `/pipeline`, zero TCP) dengan fallback otomatis ke `Map` in-memory ber-TTL; helper `hashIp`, `extractClientIp`, `getCache`, `setCache` (TTL 24 jam), `checkRateLimit` (TTL <= 1 jam), `getCodeUsage`, `incrementCodeUsage`, `incrementMetric`, `getMetricCount`, dan `resetInMemoryStore`.
- `src/lib/fallback.ts`: generator analisis strategi naratif template Bahasa Indonesia (maksimal 3 paragraf) berbasis angka deterministik F2 & F5 tanpa mengarang angka.
- `src/app/api/analyze/route.ts`: endpoint `POST /api/analyze` mengikuti urutan ketat PRD F4 (validasi `ACCESS_CODES` `401` → validasi body `400` → rate limit per IP-hash `429` → cek cache key `[input dibulatkan + dataset_version + GEMINI_MODEL]` tanpa kurangi kuota pada cache hit → cek batas kuota kode `403` pada cache miss → hitung F2 & F5 dari static import `data/index.json` → panggil Gemini REST API payload anonim zero-PII dengan timeout 12 detik → cache 24 jam + increment kuota bila sukses, atau `fallback.ts` tanpa cache & tanpa potong kuota bila gagal/timeout/key kosong).
- `src/app/api/metric/route.ts`: endpoint `POST /api/metric` menerima hanya whitelist (`sesi_selesai`, `klik_paywall`, `klik_wa`), menerapkan rate limit per IP-hash, dan menaikkan counter via `incrementMetric`.
- `src/app/api/analyze/route.test.ts` & `src/app/api/metric/route.test.ts`: 12 unit test server (mock `fetch`, tanpa kredensial eksternal) memverifikasi status `401`, `400`, `200`, cache hit tanpa potong kuota, `403` kuota habis, `429` rate limit, fallback `isFallback: true` tanpa cache/potong kuota, serta whitelist & rate limit `/api/metric`.

**Hasil verifikasi:**
- `npx tsc --noEmit`: lulus (0 error).
- `npm run lint`: lulus (0 error, 0 warning).
- `npm test`: 25/25 unit test lulus (3 file test: M2 + M5).

### M6 selesai (2026-11-20) — MVP Lengkap (M1–M6)

**File yang dibuat / diperbarui:**
- `src/config/app.config.ts`: menambahkan tipe `MetricEvent` dan `externalLinks` (`whatsappAdminUrl`, `feedbackFormUrl`).
- `src/config/copy.ts`: menambahkan seluruh teks UI untuk modal paywall (placeholder QRIS, error `400`, status submitting), tampilan hasil F5 & F6 (`UnlockedAnalysis`, pengingat screenshot, badge cache), serta kartu ajakan F7 (`feedback`).
- `src/lib/metrics.ts`: helper client-side `trackMetric(event)` fire-and-forget (`POST /api/metric`, `keepalive: true`) tanpa mengimpor modul server.
- `src/lib/redis.ts`: menyatukan sumber tipe `MetricEvent` dari `src/config/app.config.ts`.
- `src/components/features/PaywallModal.tsx`: modal F4 dengan placeholder QRIS SVG (token CSS, siap diganti `public/qris.png`), tombol WhatsApp Admin (kirim `klik_wa` + buka tab baru), form kode akses (hanya di React state, zero `localStorage`/`sessionStorage`, zero rahasia server), loading state, serta penanganan error `401`/`403`/`429`/`400`/network.
- `src/components/features/UnlockedAnalysis.tsx`: tampilan hasil F5 (hingga 3 alternatif prodi + `Badge` status, probabilitas & rentang sensitivitas, skor/nilai acuan, atau pesan kosong) & F6 (paragraf strategi AI + `Callout` "Analisis AI sedang tidak tersedia" saat `isFallback: true` + pengingat screenshot wajib).
- `src/components/features/PaywallPreview.tsx`, `src/components/features/HomeCalculator.tsx`, & `src/components/features/index.ts`: integrasi penuh alur F1–F7 — `sesi_selesai` saat hitung F2 (sekaligus reset hasil F5/F6 lama bila hitung ulang), `klik_paywall` saat klik tombol paywall, transisi ke `UnlockedAnalysis` saat `/api/analyze` sukses, dan footer ajakan F7 menuju `feedbackFormUrl`.

**Hasil verifikasi akhir MVP:**
- `npx tsc --noEmit`: lulus (0 error).
- `npm run lint`: lulus (0 error, 0 warning).
- `npm test`: 25/25 unit test lulus (3 file test: M2 + M5).
- `npm run build`: production build Next.js 16.4.6 (Turbopack) sukses 0 error (`/`, `/_not-found`, `/api/analyze`, `/api/metric`, `/design`).
- Audit keamanan klien: tidak ada `localStorage`/`sessionStorage` untuk kode akses dan tidak ada rahasia server di bundle klien.

**Ringkasan Akhir MVP (Siap Konfigurasi & Deploy Vercel):**
- Seluruh Milestone M1–M6 selesai sesuai PRD v1.2.1.
- Sebelum deploy publik, perbarui: (1) environment variables di Vercel dari `.env.example` (`GEMINI_API_KEY`, `ACCESS_CODES`, `IP_HASH_SALT`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`), (2) gambar QRIS asli (`public/qris.png`), dan (3) tautan nyata `whatsappAdminUrl` & `feedbackFormUrl` di `src/config/app.config.ts`.

### Pembaruan Pasca-MVP (2026-11-20) — Desain Soft Neo-Brutalism + Bento Grid & Mode Beta Gratis
- **Gemini & Prompting:** migrasi ke `gemini-3.5-flash-lite` (`thinkingLevel: "low"`, `maxOutputTokens: 3072`, tanpa `temperature < 1.0`), perapian `systemInstruction` (sapaan "kamu", 3 paragraf teks polos tanpa Markdown, istilah status Bahasa Indonesia, konteks validasi TKA untuk SNBP).
- **Mode Beta Gratis:** penambahan flag `paywall.isBetaMode: true` dan `feedbackFormUrl` nyata di `src/config/app.config.ts`.
- **Prototipe FigCraft & Implementasi UI Soft Neo-Brutalism + Bento Grid:**
  - Prototipe Desktop (1440px) & Mobile (390px) dibuat via MCP FigCraft dan disimpan di `design/lolosptn-prototype.figcraft`.
  - Implementasi penuh ke Next.js melalui token CSS (`src/styles/tokens.css`, `src/app/globals.css`, font `Space Grotesk` + `Plus Jakarta Sans` di `src/app/layout.tsx`, `src/config/copy.ts`), upgrade seluruh primitif `src/components/ui/` + komponen baru `Accordion.tsx`, serta 5 bagian utama halaman (`Navbar`, `HeroSection`, `BentoBenefits`, `PredictionForm` + `HasilKartu` shareable + `UnlockedAnalysis` header `#EEF2FF` + `PaywallPreview` Mode Beta inline, dan `FaqSection` 5 pertanyaan + Disclaimer Zero-PII).

### Pembaruan Rencana v4 — Tahap 1, 2, & 3 (2026-11-23)
- **Tahap 1 (Sinkronisasi Copy, Status, & PRD):**
  - Salinan rencana v4 disimpan di `docs/rencana_fitur_berbayar.md` (bersih dari tautan lokal & catatan kompetitor).
  - Seluruh copy publik di `src/config/copy.ts` diselaraskan (membedakan fitur gratis vs Beta AI, menghapus klaim AI menjanjikan target kenaikan skor, menambahkan catatan juknis SNBP 2027, dan menghapus angka harga Rp10.000 sebelum transaksi siap).
  - Label status (`Tersedia Gratis` / `Beta • Kode Kuesioner`) ditambahkan di `BentoBenefits.tsx`, dan `PRD.md` diperbarui ke v1.3 (termasuk Prinsip Netralitas).
- **Tahap 2 (Fake-Door Test menyatu dengan Alur Beta):**
  - Event metrik baru `klik_fd_tabel`, `klik_fd_simulator`, `klik_fd_ai` ditambahkan ke `app.config.ts`, `redis.ts`, `/api/metric`, dan unit testnya.
  - `PaywallPreview.tsx` diubah menjadi blok terpadu **Fitur Premium & Beta**: Strategi AI (Beta Gratis via kode kuesioner) + 2 kartu **Segera Hadir** (*Tabel 10 Alternatif + Target 60/75/90%* dan *Simulator Susunan Pilihan*) dengan modal jujur tanpa menerima pembayaran.
- **Tahap 3 (Perbaikan Fitur Gratis):**
  - Pipeline `scripts/sync_snpmb.py` + `data/index.json` + `public/data/ptn/*.json` + `src/lib/dataset.ts` menambahkan flag `acuan_dibatasi: "atas" | "bawah" | null`.
  - `src/lib/prediction.ts` menambahkan `calculateRequiredScore` (+ unit test); `HasilKartu.tsx` menampilkan **Target skor Aman (75%)** untuk SNBT lengkap dengan catatan batas skala (`acuan_dibatasi` & "Di luar skala") serta tahun & sumber data SNPMB.
  - `src/lib/fallback.ts` diperbaiki agar akurat sebagai **Ringkasan Otomatis** (tanpa saran tukar urutan untuk naikkan peluang total, tanpa saran menaikkan rapor di SNBP).
  - Endpoint gratis baru `POST /api/recommend` (+ unit test) mengembalikan maksimal 3 alternatif + Ringkasan Otomatis tanpa kode dan tanpa Gemini, ditampilkan via `FreeInsightsCard.tsx` (`THEME.resultLayoutOrder`).
  - `PredictionForm.tsx` menambahkan konfirmasi kepemilikan nilai TKA dan catatan juknis SNBP 2027 di blok eligibilitas SNBP.
- **Perapian Tata Letak `/kalkulator` (Anti-Memanjang & AI di Atas):**
  - Baris atas 2 kolom seimbang (`PredictionForm` di kiri, `HasilKartu` + `Strategi Pilihan AI` di kanan) sehingga fitur andalan AI langsung terlihat tanpa harus menggulir melewati grafik panjang, dan tidak ada duplikasi daftar 3 alternatif di `UnlockedAnalysis`.
  - Baris bawah lebar penuh berisi panel tab ringkas (`Ringkasan & 3 Alternatif` 2 kolom side-by-side | `Tren Peminat vs Daya Tampung` 2 kolom side-by-side) diikuti baris 2 kolom `Disclaimer & Metodologi` + `Kalibrasi F7`.
  - Perbaikan overflow dropdown `clearable` pada `Select.tsx` (`min-w-0 flex-1`) dan `<fieldset className="min-w-0">` di `PredictionForm.tsx`.
- **Tahap 4–7** (10 alternatif, simulator rentang, sistem kode Redis, transaksi, kerja sama) ditunda hingga hasil fake-door test memenuhi kriteria validasi.
