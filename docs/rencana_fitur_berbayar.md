# Rencana Fitur Berbayar — LolosPTN.AI (v4)

> [!NOTE]
> Status: **rencana, belum dieksekusi**. Aman masuk repo: tanpa tautan lokal dan tanpa data kompetitor (catatan kompetitor disimpan terpisah, di luar repo).

**Perubahan v4** (menggabungkan v3 + analisis eksternal + pengecekan kode):
- Tahap baru di awal: **sinkronisasi** janji publik, PRD, dan implementasi.
- **AI hanya premium.** Pengguna gratis mendapat **ringkasan otomatis** dari template (biaya Rp0).
- **3 alternatif dibuka gratis.** Premium = 10 alternatif + skor target 60/75/90% + simulator + AI.
- Fake-door test **menyatu dengan alur beta** yang sudah ada.
- Sistem kode, transaksi, dan kerja sama ditunda sampai minat tervalidasi. Aturan netralitas tetap ditulis sekarang.

**Prinsip produk:** jangan menjual harapan lolos PTN. Jual alat bantu keputusan yang transparan.

---

## 1. Kondisi Saat Ini (dicek dari kode, 22 Nov 2026)

| Fitur | Status sebenarnya |
|---|---|
| Peluang P1/P2, status, rentang, tren, acuan | Gratis, berfungsi |
| Alternatif prodi | 3 prodi (`maxAlternatives: 3`), **terkunci kode beta** |
| Strategi AI (Gemini) | **Terkunci kode beta** (kode tampil setelah kuesioner) |
| Ringkasan template (`fallback.ts`) | Ada, hanya dipakai saat Gemini gagal |
| Skor target, simulator | Belum ada |
| Laporan hasil anonim | Tautan Google Form |

**Catatan beta:** kode beta dipakai bersama dan bisa disebar. Angka pemakaiannya ≠ jumlah orang unik.

---

## 2. Pembagian Gratis vs Premium

| Gratis (Rp0 biaya operasional) | Premium |
|---|---|
| Peluang P1 & P2 + status + rentang sensitivitas | Tabel **10 alternatif** (5 dari rumpun P1 + 5 dari rumpun P2) |
| Tren historis, acuan, tahun & sumber data | **Skor target 60/75/90%** untuk semua alternatif |
| **Skor target 75%** untuk P1 & P2 (dengan catatan batas skala) | **Simulator susunan** (rentang peluang gabungan) |
| **3 alternatif** serumpun | **Saran AI (Gemini)** sesuai jatah paket |
| **Ringkasan otomatis** (template, label jujur) | Filter kota/PTN + label tren |
| Cek eligibilitas SNBP + pengingat TKA | |

---

## 3. Tahap 1 — Sinkronisasi Janji Publik & PRD

### 3.1 Copy yang wajib diperbaiki (`src/config/copy.ts`)

| Lokasi (perkiraan) | Masalah | Perbaikan |
|---|---|---|
| CTA bawah (±baris 387) | "gratis … lengkap dengan Strategi Pilihan AI" | "Gratis: peluang, tren, skor target, dan 3 alternatif. Strategi AI tersedia di paket premium." |
| Strip hero (±baris 62) | "Termasuk Strategi AI & Alternatif Prodi" | "Termasuk tren historis & alternatif prodi" |
| Meta & hero (±baris 10, 13, 47) | Menyiratkan AI termasuk gratis | Sebut AI sebagai fitur premium/beta |
| Bento AI (±baris 85) | AI menjanjikan "target kenaikan skor" | Skor target dihitung deterministik, bukan oleh AI. AI hanya memberi narasi strategi |
| FAQ TKA (±baris 358) | Ditulis sebagai fakta pasti | Tambah: "Aturan SNBP 2027 menunggu juknis resmi SNPMB" |
| Paywall (±baris 300, 302, 319) | Rp10.000 | Ikuti harga uji, atau sembunyikan sampai transaksi siap |
| FAQ beta (±baris 378) | Kode membuka "AI & alternatif" | Sesuaikan: alternatif sudah gratis, kode beta membuka AI |

### 3.2 Label status
- Setiap fitur yang dipromosikan diberi label **Tersedia / Beta / Segera hadir**.
- Tidak ada fitur yang terlihat bisa dibeli sebelum transaksi siap.

### 3.3 PRD
- Perbarui F4/F5/F6 sesuai pembagian gratis/premium. Tambah F8 (Skor Target), F9 (Simulator rentang), dan Bagian Netralitas.

---

## 4. Tahap 2 — Fake-door Test (menyatu dengan alur beta)

- Blok beta yang sudah ada diubah jadi satu blok **"Fitur Premium"**:
  - **Saran AI** → label *Beta gratis*, dibuka dengan kode kuesioner seperti sekarang.
  - **Tabel 10 alternatif + skor target 60/75/90%** → label *Segera hadir*, tombol terkunci.
  - **Simulator susunan** → label *Segera hadir*, tombol terkunci.
- Klik tombol terkunci → modal jujur *"Fitur ini sedang disiapkan. Bantu kami lewat kuesioner 1 menit"* → kuesioner yang sama dengan beta (satu ajakan, tidak dua).
- **Kuesioner ditambah:** fitur paling dibutuhkan + kemauan bayar (Rp0 / 5.000 / 9.900 / 15.000 / lainnya).
- **Metrik** (`/api/metric`): `klik_fd_tabel`, `klik_fd_simulator`, `klik_fd_ai`. Dibaca bersama `sesi_selesai` dan pemakaian kode beta.
- **Kriteria lanjut** (default, bisa diubah): ≥ 200 `sesi_selesai`, total klik fake-door ≥ 10% sesi. Fitur dengan klik tertinggi dibangun lebih dulu.
- Ini **sinyal minat**, bukan bukti kemauan bayar. Bukti sebenarnya baru didapat saat transaksi (Tahap 6).
- Tidak ada pembayaran di tahap ini.

---

## 5. Tahap 3 — Perbaikan Fitur Gratis

### 5.1 Skor target 75% untuk P1 & P2
- S_target = acuan + ln(P / (1 − P)) / k → SNBT acuan + 43,9; SNBP acuan + 2,34 komposit.
- **Catatan batas skala (wajib):**
  - Acuan di batas atas (760 / 96) → *"Acuan dibatasi 760. Persaingan sebenarnya bisa lebih ketat, jadi target ini kemungkinan terlalu rendah."*
  - Acuan di batas bawah (460 / 78) → *"Acuan dibatasi 460. Target ini kemungkinan terlalu tinggi."*
  - Target > skala maksimum (SNBT > 1000, komposit > 100) → **"Di luar skala"**.
  - Flag `acuan_dibatasi` ditambahkan di `sync_snpmb.py`.
- SNBP: target tidak ditonjolkan (rapor tidak bisa diubah, model belum terkalibrasi).

### 5.2 Tiga alternatif gratis
- Endpoint baru **tanpa kode** (misalnya `POST /api/recommend`): rate limit per IP-hash, **tanpa Gemini**, hasil **maksimal 3** (batas di server, supaya data premium tidak ikut terkirim).
- Logika F5 yang ada dipakai ulang.

### 5.3 Ringkasan otomatis (pengganti AI untuk pengguna gratis)
- Memakai `fallback.ts`, diberi label **"Ringkasan otomatis"** (bukan "AI").
- Teks template diperbarui: tidak membuka dengan "Analisis AI sedang tidak tersedia" saat dipakai sebagai fitur gratis; tidak menyarankan tukar urutan untuk menaikkan peluang; tidak menyarankan "naikkan rapor" untuk SNBP.

### 5.4 Transparansi estimasi
- Tampilkan tahun data historis dan sumbernya (SNPMB) di kartu hasil.
- Jelaskan arti persentase dan rentang sensitivitas dengan bahasa sederhana.

### 5.5 SNBP
- Cek eligibilitas + **konfirmasi kepemilikan nilai TKA** + catatan *"Aturan SNBP 2027 menunggu juknis resmi SNPMB."*

---

## 6. Tahap 4 — Mesin Premium

### 6.1 Tabel 10 alternatif + skor target 60/75/90%
- Kandidat: 5 dari rumpun P1 + 5 dari rumpun P2, tanpa duplikat. Rumpun sama atau P2 kosong → 10 dari satu rumpun. Kekurangan satu sisi diisi dari sisi lain. Aturan F5 tetap berlaku.
- Kolom: prodi, PTN, peluang + rentang, status, target 60/75/90% (SNBT), selisih, label tren deskriptif, catatan batas skala.

| Tingkat | SNBT (k = 0,025) | SNBP (k = 0,47) |
|---|---|---|
| 60% | acuan + 16,2 | acuan + 0,86 |
| 75% | acuan + 43,9 | acuan + 2,34 |
| 90% | acuan + 87,9 | acuan + 4,67 |

### 6.2 Simulator susunan (rentang)
- Batas bawah max(P₁, P₂) (asumsi tumpang tindih maksimal). Batas atas 1 − (1 − P₁)(1 − P₂) (asumsi independen, terlalu optimistis).
- **Bukan probabilitas terkalibrasi.** Wajib ada keterangan asumsinya.
- Menukar urutan tidak mengubah peluang total. Simulator hanya membandingkan **penggantian prodi**.
- Aturan jumlah dan kombinasi pilihan 2027 dicek ke SNPMB dulu.

### 6.3 Saran AI (premium)
- Dipanggil hanya lewat tombol *"Minta Saran AI untuk susunan ini"*.
- Prompt: peluang gabungan wajib berupa rentang; dilarang menyarankan tukar urutan untuk menaikkan peluang; dilarang menyarankan "naikkan rapor" untuk SNBP; **dilarang menyebut atau merekomendasikan bimbel atau produk apa pun**; skor target tidak dihitung ulang oleh AI.
- Kuota: cache dengan pembulatan kasar, model cadangan saat 429, penghitung kuota harian global → otomatis pakai template kalau mendekati batas.

### 6.4 Pengujian
- Unit test + kasus batas: acuan di clamp, target di luar skala, P1 = P2, P2 kosong, rumpun sama, kandidat kurang dari 10.

---

## 7. Tahap 5 — Sistem Kode Akses (setelah minat tervalidasi)

- **Kunci susunan:** `sha256(jalur | sort([kodeP1, kodeP2 atau "-"]))`. Mengubah skor atau menukar urutan ≠ susunan baru. Mengganti prodi/jalur = susunan baru.
- **Kode:** awalan paket + ≥ 10 karakter acak (Crockford base32, `crypto.randomBytes`). Disimpan sebagai hash di Redis.
- **Atomik:** aktivasi `SET … NX EX` (masa berlaku sejak pertama dipakai); susunan terkunci `SET … NX`; jatah AI lewat skrip Lua cek-lalu-tambah, dikembalikan jika Gemini gagal.
- **Rate limit percobaan gagal:** per IP-hash (misal 5 per 15 menit) + batas global per jam.
- **Skrip admin** `scripts/generate_codes`. `ACCESS_CODES` di env dihapus setelah beta.
- **Uji:** aktivasi bersamaan, kedaluwarsa, tebak berulang, kegagalan Gemini.

---

## 8. Tahap 6 — Transaksi (harga = hipotesis)

| Paket | Harga uji | Isi |
|---|---|---|
| Sekali Cek | Rp5.000 | Premium untuk 1 susunan, 1 saran AI, 7 hari sejak aktivasi |
| Paket Strategi | Rp9.900 | Susunan bebas 7 hari, 3 saran AI |
| Barengan | Rp20.000 | 3 kode Paket Strategi |

- Harga dievaluasi dari **pembelian nyata**, bukan hanya jawaban survei. Pantau apakah pendapatan per transaksi menutup biaya AI dan waktu admin.
- **Pengiriman manual:** *"Perhitungan instan. Kode dikirim admin lewat WhatsApp setelah pembayaran dicek."* Estimasi waktu dan jam layanan diisi sesuai kemampuan nyata `[ISI]`.
- **Kode bermasalah:** kode pengganti dulu, pengembalian dana jika tidak terkirim atau tidak bisa dipakai.
- **Halaman `/syarat`:** identitas penjual dan kontak `[ISI]`, apa yang dibeli, estimasi bukan jaminan, kebijakan kode bermasalah, privasi, anjuran izin orang tua/wali untuk **pembeli** di bawah 18 tahun.
- Copy publik tanpa nama atau angka pesaing.

> [!CAUTION]
> Sebelum menerima uang, pemilik wajib mengonfirmasi ke sumber berwenang (dokumen ini bukan nasihat hukum): kewajiban penjual produk digital kepada konsumen termasuk pembeli di bawah umur, pelindungan data pribadi, serta ketentuan biaya dan pajak metode pembayaran.

---

## 9. Tahap 7 — Kerja Sama (implementasi ditunda, aturan berlaku sekarang)

**Aturan netralitas** (juga dimasukkan ke perjanjian dengan mitra):
- Mitra tidak boleh memengaruhi angka, skor target, urutan alternatif, atau teks AI.
- Konten kerja sama diberi label **"Kerja sama"** dan dipisah secara visual dari hasil.
- Mitra hanya menerima **statistik agregat**.
- Tidak ada rekomendasi kelas/bimbel berdasarkan hasil.

**Mekanisme (nanti):** promo gratis publik → `/api/redeem` membuat kode pribadi; kode diskon mitra; kode borongan.
**Batasan promo:** batas per IP-hash mudah dilewati, jadi yang benar-benar mengikat adalah **kuota total** (puluhan dulu) dan **jatah AI 1x**. Klaim memakai `INCR` atomik.

---

## 10. Dampak ke Kode per Tahap

| Tahap | File |
|---|---|
| 1 | `src/config/copy.ts`, `PRD.md`, komponen yang menampilkan label status |
| 2 | `PaywallPreview.tsx`, `app.config.ts` (event metrik), `api/metric/route.ts`, kuesioner Google Form |
| 3 | `prediction.ts` (`requiredScore`), `sync_snpmb.py` (`acuan_dibatasi`), `api/recommend/route.ts` (baru), `fallback.ts`, `HasilKartu.tsx`, `PredictionForm.tsx`, `HomeCalculator.tsx` |
| 4 | `prediction.ts` (recommender 5+5, `combinedChanceRange`), `api/analyze/route.ts` (mode simulate/ai, prompt), `UnlockedAnalysis.tsx` |
| 5 | `src/lib/access.ts` (baru), `redis.ts`, `scripts/generate_codes` (baru) |
| 6 | `src/app/syarat/page.tsx` (baru), `PaywallModal.tsx` |
| 7 | `src/app/api/redeem/route.ts` (baru) |

> [!IMPORTANT]
> Sesuai `AGENTS.md`, baca dulu panduan Next.js di `node_modules/next/dist/docs/` sebelum menulis route handler atau halaman baru.

---

## 11. Risiko yang Dipantau

1. Estimasi konsisten secara matematis belum tentu akurat secara empiris → kalibrasi lewat laporan anonim (F7).
2. Janji ≠ implementasi → label status jujur (Tahap 1).
3. Rentang simulator disalahpahami sebagai probabilitas pasti → keterangan asumsi.
4. Kuota Gemini habis → AI hanya premium, cache, penghitung global, template.
5. Penyalahgunaan kode → atomik, kode panjang, rate limit percobaan gagal.
6. Kesiapan transaksi → identitas penjual, syarat, privasi, refund, konfirmasi hukum.

---

## 12. Keputusan Tersisa (diisi pemilik)

1. Estimasi waktu kirim kode dan jam layanan admin.
2. Identitas penjual dan kontak untuk `/syarat`.
3. Angka kriteria lanjut fake-door (default: ≥ 200 sesi, ≥ 10% klik).
4. Kuota dan durasi promo launching (default: puluhan kode, ±1 minggu).
