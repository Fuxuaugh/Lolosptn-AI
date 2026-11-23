# PRD: LolosPTN.AI (MVP v1.3)

**Perubahan dari v1.2.1 (Sinkronisasi Rencana v4 — Tahap 1–3):** pembagian fitur gratis vs premium diperjelas (peluang, target skor 75% SNBT dengan catatan batas skala `acuan_dibatasi`, ringkasan otomatis deterministik, dan 3 alternatif gratis lewat `POST /api/recommend` tanpa kode dan tanpa Gemini; Strategi AI hanya untuk Beta/Premium); blok Beta disatukan dengan fake-door test untuk 2 fitur lanjutan (`klik_fd_tabel`, `klik_fd_simulator`, `klik_fd_ai`); cek eligibilitas SNBP menambahkan konfirmasi nilai TKA dan catatan juknis 2027; aturan netralitas ditambahkan; rencana F8 (Skor Target 60/75/90% + 10 alternatif) & F9 (Simulator rentang) dicatat sebagai tahap pasca-validasi.

**Perubahan dari v1.1:** urutan kata kunci rumpun diperbaiki, input alumni per pilihan, F5 dihitung di server (paywall nyata), dataset dipecah per PTN, contoh data dikoreksi, kalibrasi dibatasi sampel minimum, istilah "rentang sensitivitas", fallback error, metrik sukses, pengecekan eligibilitas, privasi IP, dan **sistem desain yang mudah diubah (Bagian 7)**.

**Patch v1.2.1 (penyesuaian implementasi Vercel Serverless):** Upstash Redis menjadi penyimpanan state produksi (kuota kode, rate limit, cache, metrik); cache hit tidak mengurangi kuota kode; `data/index.json` menjadi flat list untuk dropdown dan F5; `kuota_terbaru` diambil dari field API tahun berjalan; `/api/report` dihapus (F7 lewat Google Form anonim) dan `/api/metric` ditambahkan; prioritas sistem desain dibagi P0 dan P2. Bagian yang terdampak sudah diperbarui di tempatnya.

## 1. Ringkasan Produk & Tujuan MVP

- **Nama Produk:** LolosPTN.AI
- **Deskripsi:** Platform web berbasis AI untuk membantu siswa kelas 12 dan *gap year* memperkirakan peluang diterima pada jalur **SNBP** dan **SNBT** secara terukur dan transparan, serta menemukan alternatif program studi yang realistis.
- **Cakupan Data:** Seluruh PTN di Provinsi Jawa Timur (`kode_prov1: "050000"`), data historis SNPMB yang tersedia di API. Tahun terbaru dibaca otomatis dari API (bukan di-hardcode); contoh di dokumen ini hanya ilustrasi.
- **Tujuan MVP (terukur):**
  1. Memeriksa konsistensi *proxy score* terhadap tren rasio penerimaan historis, dan melakukan sanity check awal memakai laporan kelulusan *self-reported* anonim (target 15–30 laporan).
  2. Menguji *willingness to pay* siswa pada mikrotransaksi Rp5.000–Rp15.000/sesi via QRIS.
  3. Membangun prototipe fungsional dengan biaya operasional Rp0.
- **Metrik Sukses MVP** (dicatat sebagai counter anonim di Upstash Redis lewat /api/metric, tanpa PII; custom event Vercel Web Analytics kemungkinan tidak tersedia di plan Hobby, verifikasi dulu):
  - Jumlah sesi perhitungan selesai.
  - Persentase sesi yang menekan "Buka Analisis Lengkap".
  - Jumlah konfirmasi WhatsApp dan jumlah kode akses yang dipakai.
  - Jumlah laporan hasil seleksi yang masuk (dari Google Sheets milik Google Form anonim).
  - Target awal (bisa diubah): ≥200 sesi, ≥10% klik paywall, ≥5 konfirmasi pembayaran.

## 2. Tech Stack, Environment & Kepatuhan

- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS.
- **Hosting:** Vercel Hobby (gratis).
- **Data:** File JSON statis di repo (snapshot cadangan jika endpoint tidak resmi `snpmb.id` berubah atau diblokir).
- **AI Engine:** Google Gemini API via AI Studio (*free tier*).
- **Environment Variables:**
  - `GEMINI_API_KEY`: kunci API.
  - `GEMINI_MODEL`: nama model aktif (default `gemini-2.5-flash`), tanpa perlu ubah kode.
  - `ACCESS_CODES`: daftar kode akses dipisah koma (validasi **hanya di server**, dilarang ada di bundle klien).
  - `ACCESS_CODE_MAX_USES`: batas pemakaian per kode (default 50).
  - `IP_HASH_SALT`: garam untuk hash IP pada rate limit.
  - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` *(wajib di produksi)*: penyimpanan state produksi (kuota kode akses, rate limit, cache Gemini, counter metrik). Jika kosong, server memakai Map in-memory (hanya untuk dev lokal, best-effort).
- **Privasi & Data Anak (<18 tahun):**
  - Zero PII: tidak ada nama, NISN, asal sekolah, email, atau identitas lain yang dikumpulkan.
  - Payload ke Gemini hanya berisi angka skor/nilai, jalur, dan nama prodi.
  - IP untuk rate limit disimpan dalam bentuk hash (`sha256(ip + IP_HASH_SALT)`) dan kedaluwarsa otomatis (TTL ≤ 1 jam).
  - Pemberitahuan privasi wajib ada di disclaimer.

## 3. Struktur Folder

```text
lolosptn-ai/
├── scripts/
│   └── sync_snpmb.py            # Tarik API SNPMB, gabung kalibrasi, hitung proxy score
├── data/
│   ├── kalibrasi.json           # Offset per prodi & override rumpun (aman dari overwrite)
│   ├── index.json               # Flat list seluruh prodi tanpa historis (dropdown + F5)
│   └── ptn/
│       └── {id_ptn}.json        # Detail & historis per PTN (dimuat sesuai kebutuhan)
├── src/
│   ├── app/
│   │   ├── page.tsx             # Halaman utama: form, hasil, paywall
│   │   ├── design/page.tsx      # Galeri komponen (P2; versi minimal disarankan, dev only)
│   │   └── api/
│   │       ├── prodi/route.ts   # Detail 1 PTN (?ptn=385)
│   │       ├── analyze/route.ts # Kode, rate limit, cache, F5, Gemini, fallback
│   │       └── metric/route.ts  # Counter metrik anonim (daftar putih event)
│   ├── config/
│   │   ├── theme.ts             # Token desain & preferensi tema
│   │   ├── copy.ts              # Semua teks UI (ID)
│   │   └── app.config.ts        # Ambang status, bobot, koefisien, delta, batas rate limit
│   ├── styles/
│   │   └── tokens.css           # CSS variables (warna, radius, font, spasi)
│   ├── lib/
│   │   ├── prediction.ts        # Mesin kalkulasi deterministik + recommender
│   │   ├── dataset.ts           # Loader data per PTN & impor statis index.json
│   │   ├── redis.ts             # Klien Upstash + fallback Map (dev lokal)
│   │   └── fallback.ts          # Analisis template jika Gemini gagal
│   └── components/
│       ├── ui/                  # Primitif: Button, Card, Badge, Modal, Tabs, Select, Callout
│       └── features/            # Form, HasilKartu, TrenChart, PaywallModal, MetodologiModal
```

### Contoh `data/ptn/385.json` (ilustrasi, konsisten dengan rumus)

```json
{
  "id_ptn": 385,
  "nama_ptn": "UPN \"VETERAN\" JAWA TIMUR",
  "kota": "Kota Surabaya",
  "prodi_list": [
    {
      "kode_prodi": "13851006",
      "nama": "INFORMATIKA",
      "jenjang": "S1",
      "rumpun": "Komputer & IT",
      "nama_portofolio": "Tidak Ada",
      "is_new": 0,
      "snbt": {
        "tersedia": true,
        "kuota_terbaru": 150,
        "rasio_diterima_persen": 17.6,
        "skor_acuan_mentah": 594.1,
        "offset_diterapkan": -10,
        "skor_acuan": 584.1,
        "historis": [
          { "tahun": 2023, "daya_tampung": 140, "peminat": 1011 },
          { "tahun": 2024, "daya_tampung": 145, "peminat": 895 },
          { "tahun": 2025, "daya_tampung": 148, "peminat": 742 }
        ]
      },
      "snbp": {
        "tersedia": true,
        "kuota_terbaru": 90,
        "rasio_diterima_persen": 11.18,
        "rapor_acuan_mentah": 88.48,
        "offset_diterapkan": 0,
        "rapor_acuan": 88.48,
        "historis": [
          { "tahun": 2024, "daya_tampung": 88, "peminat": 790 },
          { "tahun": 2025, "daya_tampung": 90, "peminat": 803 }
        ]
      }
    }
  ]
}
```

Aturan skema: `skor_acuan` / `rapor_acuan` yang tersimpan **sudah termasuk offset**. Nilai mentah dan offset disimpan terpisah agar bisa diaudit. `kuota_terbaru` diambil langsung dari field daya tampung seleksi tahun berjalan di API (`daya_tampung_snbt` / `daya_tampung_snbp`) dan hanya untuk ditampilkan; nilainya **tidak** harus sama dengan tahun terakhir di `historis`, dan **tidak** dipakai menghitung `rasio_diterima`.

### Contoh `data/index.json` (flat list, tanpa `historis`)

```json
[
  {
    "id_ptn": 385,
    "nama_ptn": "UPN \"VETERAN\" JAWA TIMUR",
    "kode_prodi": "13851006",
    "nama": "INFORMATIKA",
    "jenjang": "S1",
    "rumpun": "Komputer & IT",
    "is_new": 0,
    "snbt": { "tersedia": true, "skor_acuan": 584.1, "jumlah_tahun_histori": 3 },
    "snbp": { "tersedia": true, "rapor_acuan": 88.48, "jumlah_tahun_histori": 2 }
  }
]
```

File ini diimpor statis di route handler (bukan dibaca lewat `fs`, agar ikut ter-bundle di Vercel) dan melayani dropdown serta perhitungan F5. `jumlah_tahun_histori` dipakai untuk menentukan δ (rentang sensitivitas).

### Contoh `data/kalibrasi.json`

```json
{
  "13851006": {
    "snbt_offset": -10,
    "snbp_offset": 0,
    "n_laporan": 12,
    "rumpun_override": null,
    "catatan": "Offset hanya aktif jika n_laporan >= 10"
  }
}
```

## 4. Aturan Pipeline Data (`scripts/sync_snpmb.py`)

1. **Sumber:** `proxy-ptn-sb.php`, `proxy-prodi-sb.php?ptn={id_ptn}` (SNBT), `proxy-prodi-sn.php?ptn={id_ptn}` (SNBP); filter `kode_prov1 == "050000"`. Ambil maksimal 3 tahun terakhir yang tersedia, termasuk tahun terbaru jika sudah dirilis. kuota\_terbaru diambil dari field daya tampung tahun berjalan di API (daya\_tampung\_snbt / daya\_tampung\_snbp), terpisah dari array historis; verifikasi nama field dengan satu respons nyata sebelum coding. Buang `history_peminat_provinsi`.
2. **Penggabungan SNBT dan SNBP:** kunci `kode_prodi`. Jika prodi hanya ada di satu jalur, objek jalur lainnya diisi `{ "tersedia": false }`. Prodi tersebut tidak muncul di dropdown jalur yang tidak tersedia.
3. **Rasio diterima:**
   - `rasio_diterima = daya_tampung / peminat`. Dihitung hanya dari array historis (tahun dengan daya tampung dan peminat lengkap); kuota\_terbaru hanya untuk ditampilkan. Nilai di-clamp 0.005–0.95.
   - Rata-rata tertimbang: tahun terbaru 50%, -1 tahun 30%, -2 tahun 20%, dinormalisasi bila data kurang dari 3 tahun.
   - Prodi baru (`is_new == 1` atau histori kosong): default 0.15.
4. **Proxy score:**
   - `Z = NormalDist().inv_cdf(1 - rasio_diterima)`
   - `skor_acuan_mentah` (SNBT) = `515 + 85 * Z`
   - `rapor_acuan_mentah` (SNBP) = `83.0 + 4.5 * Z`
   - Offset (dari `kalibrasi.json`) hanya diterapkan jika `n_laporan >= 10`. `skor_acuan` = clamp(mentah + offset, 460, 760); `rapor_acuan` = clamp(mentah + offset, 78.0, 96.0).
5. **Klasifikasi rumpun** (urutan prioritas, berhenti di kecocokan pertama): 0. Cek `rumpun_override` di `kalibrasi.json`.
   1. **Aturan khusus:** nama diawali `PENDIDIKAN DOKTER` → Kesehatan & Medis. Nama diawali `PENDIDIKAN` atau `PGSD` / `PGPAUD` → Pendidikan.
   2. **Pertanian & Hayati:** `AGRO` (termasuk AGROEKONOMI, AGRIBISNIS), `PERTANIAN`, `PETERNAKAN`, `PERIKANAN`, `KELAUTAN`, `PERAIRAN`, `KEHUTANAN`, `TEKNOLOGI PANGAN`.
   3. **Kesehatan & Medis:** `DOKTER`, `KEDOKTERAN`, `FARMASI`, `KEPERAWATAN`, `KESEHATAN`, `GIZI`, `KEBIDANAN`, `FISIOTERAPI`.
   4. **Komputer & IT:** `INFORMATIKA`, `SISTEM INFORMASI`, `ILMU KOMPUTER`, `TEKNIK KOMPUTER`, `SAINS DATA`, `TEKNOLOGI INFORMASI`, `REKAYASA PERANGKAT`, `KECERDASAN BUATAN`.
   5. **Teknik & Rekayasa:** `TEKNIK`, `ARSITEKTUR`, `PERENCANAAN WILAYAH`, `GEOMATIKA`, `METALURGI`, `REKAYASA`.
   6. **Ekonomi & Bisnis:** `MANAJEMEN`, `AKUNTANSI`, `EKONOMI`, `BISNIS`, `KEUANGAN`, `PERPAJAKAN`, `ADMINISTRASI BISNIS`, `ADMINISTRASI NIAGA`.
   7. **Pendidikan:** `KEPELATIHAN`, `BIMBINGAN DAN KONSELING`.
   8. **Sosial, Hukum & Humaniora:** `HUKUM`, `KOMUNIKASI`, `HUBUNGAN INTERNASIONAL`, `SOSIOLOGI`, `PSIKOLOGI`, `POLITIK`, `ADMINISTRASI PUBLIK`, `SASTRA`, `BAHASA`, `SEJARAH`, `DESAIN`, `SENI`.
   9. **Sains & Umum:** fallback (`MATEMATIKA`, `FISIKA`, `KIMIA`, `BIOLOGI`, `STATISTIKA`, dll.).
   - Skrip mencetak daftar prodi yang jatuh ke fallback agar bisa ditinjau dan di-override manual.
6. **Output:** `data/index.json` (flat list seluruh prodi tanpa array historis, dipakai dropdown dan F5) dan `data/ptn/{id_ptn}.json`.
7. **Kebijakan:** sebelum rilis tahunan, cek ulang aturan kuota, eligibilitas, dan jumlah pilihan SNBP/SNBT di situs resmi SNPMB.

## 5. Spesifikasi Fitur & Rumus Deterministik

### F1. Dual-Track Form & Selector (Gratis)

- *Tab switcher* Jalur SNBT / SNBP.
- *Searchable dropdown* Pilihan 1 dan Pilihan 2 (PTN → Prodi, hanya `tersedia: true` pada jalur terpilih). Data PTN dimuat sesuai kebutuhan lewat `/api/prodi`, bukan seluruh dataset.
- **Input SNBT:** skor 7 subtes UTBK, atau toggle "Input Rata-rata Langsung" (200–1000).
- **Input SNBP:**
  - Rata-rata rapor semester 1–5 (0–100).
  - Rata-rata 2 mapel pendukung jurusan (0–100).
  - Akreditasi sekolah (`A`, `B`, `C`).
  - **Rekam jejak alumni di PTN tujuan, terpisah untuk Pilihan 1 dan Pilihan 2** (`Ada` / `Tidak Ada`).
  - Prestasi tertinggi (`Nasional/Internasional`, `Provinsi`, `Kabupaten/Kota`, `Tidak Ada`).
- **Cek eligibilitas SNBP:** pertanyaan awal "Apakah sekolahmu dan kamu masuk daftar eligible SNBP tahun ini?" Jika "Tidak/Belum tahu", tampilkan peringatan dan arahkan ke info resmi SNPMB.
- Validasi input: rentang angka, tidak boleh kosong, pesan galat jelas.

### F2. Deterministic Prediction Engine (`src/lib/prediction.ts`) (Gratis)

Semua probabilitas dihitung di TypeScript, tidak oleh LLM. Semua konstanta (koefisien, delta, bobot, ambang) dibaca dari `src/config/app.config.ts`.

**A. SNBT**

- `ΔS = S_user - skor_acuan`
- `P = 100 / (1 + exp(-0.025 * ΔS))`

**B. SNBP**

| Akreditasi | Alumni di PTN: Ada | Alumni di PTN: Tidak Ada |
| :-- | :-: | :-: |
| A | 94 | 86 |
| B | 88 | 81 |
| C | 82 | 75 |

- `SkorPrestasi`: Nasional/Internasional 98, Provinsi 92, Kabupaten/Kota 88, Tidak Ada 84.
- `S_snbp = 0.50*Rapor + 0.20*MapelPendukung + 0.20*SkorSekolahAlumni + 0.10*SkorPrestasi`
- `ΔR = S_snbp - rapor_acuan`
- `P = 100 / (1 + exp(-0.47 * ΔR))` (0.47 ≈ 0.025 × 85 / 4.5)
- Status alumni dipakai **per pilihan** sesuai PTN masing-masing.

**C. Rentang Sensitivitas** (heuristik, bukan interval kepercayaan statistik)

- `δ_snbt = 15` poin (25 jika `is_new == 1` atau histori < 3 tahun).
- `δ_snbp = 1.0` poin (1.8 jika `is_new == 1` atau histori < 3 tahun).
- `P_low` memakai `acuan + δ`, `P_high` memakai `acuan - δ`.
- Tampilan: `64% (Rentang sensitivitas: 55% – 72%)`.
- Label di UI dan Metodologi harus menyebut bahwa rentang ini menunjukkan seberapa sensitif hasil terhadap ketidakpastian acuan, bukan jaminan statistik.

**D. Kategori Status** (satu sumber di `app.config.ts`, dipakai F2 dan F5)

- **Aman (Safety):** P ≥ 75% (token warna `status-safe`)
- **Moderat (Target):** 50% ≤ P < 75% (`status-target`)
- **Spekulatif (Reach):** P < 50% (`status-reach`)

### F3. Tren Historis & Transparency Callout (Gratis)

- Grafik/tabel Peminat vs Daya Tampung (tahun yang tersedia) dan syarat `nama_portofolio`.
- Callout kuning wajib di halaman hasil (teks diambil dari `copy.ts`):

  > **Perhatikan:** SNPMB tidak mengumumkan *passing grade* resmi. Data ini adalah **estimasi statistik berdasarkan tren daya tampung & peminat SNPMB** dan dapat berubah. Gunakan sebagai acuan strategi, bukan patokan mutlak. **Privasi:** Kami tidak menyimpan atau mengirim data identitas pribadi; hanya angka nilai dan pilihan prodi yang diproses.
- Modal **"Lihat Metodologi"**: rumus rasio diterima, pemetaan persentil normal, koefisien sigmoid, rentang sensitivitas (dan bahwa itu heuristik), serta keterbatasan: tidak ada data hasil per individu dari SNPMB.

### F4. Paywall Mikrotransaksi & Keamanan Server

- F5 dan F6 dikunci di UI (*blurred overlay*) dengan tombol **"Buka Analisis Lengkap (Rp10.000)"**. **Isi F5 dan F6 tidak ada di klien sebelum kode valid**, sehingga blur tidak bisa dibuka lewat devtools.
- Modal: placeholder QRIS statis, tombol WhatsApp Admin, input **Kode Akses**.
- Alur: klien mengirim input pengguna + kode ke `/api/analyze`. Server memvalidasi terhadap `ACCESS_CODES` (401 jika salah), memeriksa batas pemakaian per kode (`ACCESS_CODE_MAX_USES`) dan rate limit per IP-hash (default 5 permintaan / 10 menit), lalu menghitung F5 dan memanggil F6 di server dan mengembalikan keduanya.
- Kode akses tidak disimpan di localStorage; sesi cukup di memori halaman. Setelah refresh, pengguna memasukkan kode lagi (tidak memotong kuota selama hasilnya masih ada di cache).

**Penyimpanan state (Upstash Redis, free tier):** dipakai untuk (1) hitungan pemakaian kode akses, (2) rate limit per IP-hash dengan TTL ≤ 1 jam, (3) cache respons Gemini (TTL 24 jam), dan (4) counter metrik anonim (`INCR`). Jika `UPSTASH_REDIS_REST_URL` kosong, server memakai `Map` in-memory (best-effort, khusus dev lokal). Gabungkan operasi dalam satu pipeline per permintaan untuk menghemat jumlah perintah; cek batas free tier terbaru.

**Urutan pemrosesan `/api/analyze`:**

1. Validasi kode akses (401 jika salah).
2. Rate limit per IP-hash.
3. Cek cache. Kunci cache = input yang dibulatkan + versi dataset + `GEMINI_MODEL`.
4. Cache hit: kembalikan hasil tanpa mengurangi kuota kode, agar pengguna yang tidak sengaja me-refresh browser HP tidak dirugikan.
5. Cache miss: hitung F5, panggil Gemini (atau analisis template jika gagal), simpan ke cache.
6. Kuota kode dikurangi hanya setelah analisis Gemini berhasil. Jika yang tampil analisis template karena Gemini gagal, kuota tidak dikurangi.

**Metrik anonim:** endpoint ringan `/api/metric` hanya menerima event dari daftar putih (`sesi_selesai`, `klik_paywall`, `klik_wa`, `klik_fd_tabel`, `klik_fd_simulator`, `klik_fd_ai`), diberi rate limit, lalu melakukan `INCR` di Redis. Klik paywall, fake-door, dan WhatsApp terjadi sebelum ada permintaan analisis, sehingga tidak bisa dicatat dari `/api/analyze`.

**Pengingat UI:** kartu hasil F6 menampilkan catatan dari `copy.ts`: "Simpan atau screenshot hasil strategi AI ini sebelum menutup halaman."

### F5. Smart Alternative Recommender & Ringkasan Otomatis (Gratis via `POST /api/recommend`, dihitung di server)

- Sumber data: `data/index.json` (flat list tanpa historis, diimpor statis di route handler), sehingga tidak perlu membuka file per PTN. Kandidat: prodi `tersedia: true` pada jalur terkait dengan `rumpun` sama dengan Pilihan 1, kecuali Pilihan 1 dan 2.
- Endpoint gratis `POST /api/recommend` tanpa kode akses dan tanpa panggilan Gemini, dilindungi rate limit per IP-hash, mengembalikan maksimal 3 alternatif dan **Ringkasan Otomatis** (template `fallback.ts`, berlabel jujur bukan AI).
- Alumni SNBP: PTN sama dengan Pilihan 1 → pakai input pengguna; PTN berbeda → `Tidak Ada`.
- Pilih kandidat berstatus **Aman**, urutkan `skor_acuan` / `rapor_acuan` menurun, ambil 3 teratas.
- *Fallback:* jika kurang dari 3, lengkapi dari **Moderat** (P tertinggi ke terendah) dengan label status yang sesuai.
- Jika kandidat kosong, tampilkan pesan "belum ada alternatif yang cocok", bukan layar kosong.

### F6. AI Strategy Advisor (`/api/analyze` — Beta / Premium)

- Memanggil `process.env.GEMINI_MODEL` dengan payload anonim: jalur, skor pengguna, hasil F2 Pilihan 1 & 2, 3 alternatif F5.
- *System prompt:* dilarang mengubah atau mengarang angka; maksimal 3 paragraf (\~250–300 kata): posisi Pilihan 1 & 2, saran strategi pilihan, langkah taktis (untuk SNBP dilarang menyarankan menaikkan rapor).
- **Cache:** Upstash Redis, TTL 24 jam. Kunci cache = input yang dibulatkan + versi dataset + `GEMINI_MODEL`. Fallback `Map` in-memory hanya untuk dev lokal. Cache hit tidak mengurangi kuota kode akses.
- **Error state:** jika Gemini gagal, timeout, atau kuota habis, tampilkan analisis template dari `fallback.ts` berbasis angka F2/F5 dengan catatan "Analisis AI sedang tidak tersedia". F5 tetap tampil dan kuota kode tidak dikurangi.

### F7. Laporan Hasil Seleksi Anonim (opsional, untuk kalibrasi)

- Tautan ke Google Form anonim yang terhubung ke Google Sheets (tanpa endpoint /api/report di MVP): jalur, prodi, rentang skor/nilai, hasil (lolos/tidak). Tanpa nama, kontak, atau sekolah.
- Digunakan sebagai sanity check proxy. Offset per prodi baru diterapkan jika `n_laporan >= 10` untuk prodi itu.

### F8 & F9 (Pasca-Validasi Fake-Door — lihat `docs/rencana_fitur_berbayar.md`)

- **F8 (Premium, menunggu validasi):** Tabel hingga 10 alternatif (5 rumpun Pilihan 1 + 5 rumpun Pilihan 2, tanpa duplikat) + target skor 60/75/90% dengan catatan batas skala `acuan_dibatasi` dan "Di luar skala". Target skor 75% untuk Pilihan 1 & 2 SNBT sudah tersedia gratis di kartu hasil.
- **F9 (Premium, menunggu validasi):** Simulator susunan pilihan berbasis rentang `max(P1, P2)` sampai `1 - (1-P1)(1-P2)` beserta keterangan asumsi (bukan probabilitas terkalibrasi).

### Prinsip Netralitas (berlaku sejak sekarang)

- Mitra atau pihak luar tidak boleh memengaruhi angka peluang, skor target, urutan alternatif, atau teks AI.
- Konten kerja sama wajib diberi label **"Kerja sama"** dan dipisah secara visual dari hasil perhitungan.
- Mitra hanya menerima statistik agregat; tidak ada data per siswa dan tidak ada rekomendasi kelas/bimbel berdasarkan hasil.

## 6. Batasan MVP (Out of Scope)

- Login/Register dan riwayat pengguna di database.
- Payment gateway otomatis (Midtrans/Xendit) dengan webhook.
- Cakupan PTN di luar Jawa Timur.
- Klaim akurasi individual: SNPMB tidak merilis data hasil per orang.

## 7. Sistem Desain yang Mudah Diubah

Tujuan: tampilan (warna, font, bentuk, teks, tata letak) bisa diganti kapan saja **tanpa menyentuh logika kalkulasi**.

### 7.0 Prioritas Scope (P0 / P2)

- **P0 (wajib di MVP):** token semantik (`tokens.css`), pemisahan `copy.ts` dan `app.config.ts`, komponen `ui/` dan `features/`, tata letak mobile-first 360–430 px, kontras WCAG AA, dan status yang tidak hanya dibedakan warna.
- **P2 (ditunda pasca-validasi MVP):** dark mode, preset tema (`default` / `sekolah` / `gelap`), variasi `density`, dan galeri `/design` lengkap. Disarankan tetap membuat galeri minimal (Button, tiga Badge status, Callout, Card) agar dampak perubahan token mudah dicek.

### 7.1 Prinsip

1. **Token dulu, bukan nilai langsung.** Dilarang menulis hex, ukuran piksel, atau nama font langsung di komponen. Semua lewat token.
2. **Pisahkan logika dan tampilan.** `lib/` dan hook tidak boleh berisi class styling. Komponen `features/` hanya merakit komponen `ui/`.
3. **Semua teks di `copy.ts`.** Komponen tidak berisi string UI (termasuk disclaimer, label status, judul tombol).
4. **Konfigurasi di satu tempat.** Ambang status, warna status, dan urutan bagian halaman dibaca dari config.
5. **Satu komponen, satu tanggung jawab.** Mengganti gaya `Button` cukup mengubah satu file.

### 7.2 Token (`src/styles/tokens.css`)

CSS variables dengan *semantic naming*, dipetakan ke Tailwind lewat `tailwind.config.ts` (mis. `bg-surface`, `text-fg`, `bg-brand`, `border-line`, `bg-status-safe`).

```css
:root {
  --color-brand: #2563eb;
  --color-brand-fg: #ffffff;
  --color-surface: #ffffff;
  --color-surface-muted: #f4f5f7;
  --color-fg: #111827;
  --color-fg-muted: #6b7280;
  --color-line: #e5e7eb;
  --color-status-safe: #16a34a;
  --color-status-target: #d97706;
  --color-status-reach: #dc2626;
  --color-callout-bg: #fef9c3;
  --radius-card: 16px;
  --radius-control: 12px;
  --font-sans: "Inter", system-ui, sans-serif;
  --space-section: 24px;
}
[data-theme="dark"] {
  --color-surface: #0f172a;
  --color-surface-muted: #1e293b;
  --color-fg: #f1f5f9;
  --color-fg-muted: #94a3b8;
  --color-line: #334155;
}
```

Nilai di atas hanyalah contoh awal; ganti sesuai identitas visual yang diinginkan.

### 7.3 Konfigurasi Tema (`src/config/theme.ts`)

- Nama tema aktif (`light` / `dark` / `system`), brand name, logo, dan favicon.
- Preset tema opsional (mis. `default`, `sekolah`, `gelap`) yang masing-masing menimpa token. Ganti preset dengan satu baris config.
- Varian bentuk: `cardStyle: "flat" | "elevated" | "outlined"`, `density: "comfortable" | "compact"`.

### 7.4 Konten (`src/config/copy.ts`)

- Objek terstruktur per bagian: `hero`, `form`, `hasil`, `status` (label Aman/Moderat/Spekulatif), `paywall`, `metodologi`, `disclaimer`, `error`.
- Mengubah bahasa, nada, atau nama tombol tidak butuh menyentuh komponen.

### 7.5 Komponen

- `components/ui/`: Button, Card, Badge (menerima `status`), Modal, Tabs, Select (searchable), Callout, Skeleton, Input. Tidak mengenal domain SNBP/SNBT.
- `components/features/`: rakitan domain (Form SNBT/SNBP, HasilKartu, TrenChart, PaywallModal, MetodologiModal). Hanya memakai `ui/`, token, dan `copy.ts`.
- Grafik tren memakai warna dari token (baca via CSS variable), bukan warna bawaan library.
- Tata letak halaman hasil ditentukan array urutan di config (mis. `["hasil", "tren", "callout", "paywall"]`) agar urutan bisa diubah.

### 7.6 Halaman Galeri (`/design`, hanya mode development; P2, versi minimal disarankan)

- Menampilkan semua komponen `ui/` dan `features/` dengan data contoh, semua status, mode terang/gelap, dan tampilan mobile.
- Dipakai untuk melihat dampak perubahan token atau komponen secara langsung. Dinonaktifkan di production (`process.env.NODE_ENV`).

### 7.7 Aturan Mobile-First & Aksesibilitas

- Dirancang untuk lebar 360–430 px terlebih dahulu; target sentuh minimal 44 px.
- Kontras teks memenuhi WCAG AA; status tidak hanya dibedakan warna (sertakan ikon dan label teks).
- Hormati `prefers-reduced-motion` dan `prefers-color-scheme`.

### 7.8 Panduan untuk Alat Vibe Coding

Sertakan di prompt pembangunan: "Jangan hardcode warna, font, atau teks UI di komponen. Gunakan token dari `tokens.css`, kelas Tailwind semantik, dan string dari `copy.ts`. Jangan mencampur logika kalkulasi ke komponen. Setiap komponen baru wajib didokumentasikan di galeri komponen (bila sudah ada): halaman `/design`."

## 8. Rencana Pengerjaan Bertahap

1. **Data:** `sync_snpmb.py`, `index.json` (flat list), `ptn/*.json`, `kalibrasi.json`, unit test rumus rasio dan Z.
2. **Engine:** `prediction.ts` dengan unit test (contoh: INFORMATIKA UPNVJT pada skor = acuan → P = 50%).
3. **Fondasi desain (P0):** token, config, `copy.ts`, komponen `ui/`; galeri minimal opsional.
4. **Fitur gratis:** form, hasil, tren, callout, metodologi.
5. **Server:** Upstash Redis, `/api/analyze` (kode, rate limit, cache, F5, Gemini, fallback), `/api/metric`.
6. **Paywall & metrik**, lalu uji dengan pengguna nyata.

## 9. Item Terbuka (perlu diverifikasi)

- Aturan resmi SNPMB tahun berjalan: eligibilitas SNBP per akreditasi, jumlah pilihan prodi per jalur, dan perubahan kuota.
- Ketersediaan data tahun terbaru di API `snpmb.id` dan kestabilan endpoint.
- Nama field API untuk kuota tahun berjalan (`daya_tampung_snbt` / `daya_tampung_snbp`): cek satu respons nyata sebelum coding.
- Batas free tier Upstash Redis terkini dan jumlah perintah per permintaan.
- Ketersediaan custom event Vercel Web Analytics di plan Hobby; jika tidak ada, andalkan counter Redis.
- Pemilihan ambang target metrik sukses.
- Kebijakan privasi Gemini free tier (data bisa dipakai untuk peningkatan produk); pertimbangkan beralih ke tier berbayar jika trafik dan data bertambah.
