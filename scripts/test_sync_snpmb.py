"""Unit test pipeline data LolosPTN.AI. Jalankan: python -m unittest scripts/test_sync_snpmb.py -v"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import sync_snpmb as s  # noqa: E402

# Contoh INFORMATIKA UPNVJT (SNBT) dari PRD Bagian 3
HIST_INF = [
    {"tahun": 2023, "daya_tampung": 140, "peminat": 1011},
    {"tahun": 2024, "daya_tampung": 145, "peminat": 895},
    {"tahun": 2025, "daya_tampung": 148, "peminat": 742},
]


class TestSelectHistoris(unittest.TestCase):
    def test_ambil_3_tahun_terakhir_lengkap(self):
        raw = [
            {"id_prodi": 1, "tahun": 2021, "daya_tampung": 10, "peminat": 100, "terima": None},
            {"id_prodi": 1, "tahun": 2022, "daya_tampung": 10, "peminat": 100, "terima": None},
            {"id_prodi": 1, "tahun": 2023, "daya_tampung": 10, "peminat": 100, "terima": None},
            {"id_prodi": 1, "tahun": 2024, "daya_tampung": 10, "peminat": 100, "terima": None},
            {"id_prodi": 1, "tahun": 2025, "daya_tampung": 10, "peminat": None, "terima": None},
        ]
        h = s.select_historis(raw)
        self.assertEqual([x["tahun"] for x in h], [2022, 2023, 2024])
        self.assertEqual(set(h[0]), {"tahun", "daya_tampung", "peminat"})

    def test_kosong(self):
        self.assertEqual(s.select_historis(None), [])
        self.assertEqual(s.select_historis([]), [])


class TestRasioDiterima(unittest.TestCase):
    def test_tertimbang_3_tahun_contoh_prd(self):
        exp = 0.5 * 148 / 742 + 0.3 * 145 / 895 + 0.2 * 140 / 1011
        self.assertAlmostEqual(s.rasio_diterima(HIST_INF), exp, places=9)
        self.assertEqual(round(s.rasio_diterima(HIST_INF) * 100, 1), 17.6)

    def test_urutan_input_tidak_berpengaruh(self):
        self.assertAlmostEqual(s.rasio_diterima(list(reversed(HIST_INF))), s.rasio_diterima(HIST_INF))

    def test_normalisasi_2_tahun(self):
        h = [{"tahun": 2024, "daya_tampung": 88, "peminat": 790},
             {"tahun": 2025, "daya_tampung": 90, "peminat": 803}]
        exp = (0.5 * 90 / 803 + 0.3 * 88 / 790) / 0.8
        self.assertAlmostEqual(s.rasio_diterima(h), exp, places=9)
        self.assertEqual(round(s.rasio_diterima(h) * 100, 2), 11.18)  # contoh PRD

    def test_normalisasi_1_tahun(self):
        h = [{"tahun": 2025, "daya_tampung": 30, "peminat": 300}]
        self.assertAlmostEqual(s.rasio_diterima(h), 0.1)

    def test_default_prodi_baru_dan_kosong(self):
        self.assertEqual(s.rasio_diterima([], 0), 0.15)
        self.assertEqual(s.rasio_diterima(HIST_INF, is_new=1), 0.15)

    def test_clamp_atas_dan_bawah(self):
        atas = [{"tahun": 2025, "daya_tampung": 100, "peminat": 50}]
        bawah = [{"tahun": 2025, "daya_tampung": 1, "peminat": 10000}]
        self.assertEqual(s.rasio_diterima(atas), 0.95)
        self.assertEqual(s.rasio_diterima(bawah), 0.005)

    def test_clamp_per_tahun_sebelum_pembobotan(self):
        h = [{"tahun": 2024, "daya_tampung": 200, "peminat": 100},  # 2.0 -> 0.95
             {"tahun": 2025, "daya_tampung": 10, "peminat": 100}]   # 0.1
        self.assertAlmostEqual(s.rasio_diterima(h), (0.5 * 0.1 + 0.3 * 0.95) / 0.8)


class TestZScoreProxy(unittest.TestCase):
    def test_z_median(self):
        self.assertAlmostEqual(s.z_score(0.5), 0.0, places=12)
        self.assertEqual(s.proxy_snbt(0.5)["skor_acuan"], 515.0)
        self.assertEqual(s.proxy_snbp(0.5)["rapor_acuan"], 83.0)

    def test_z_positif_saat_rasio_kecil(self):
        self.assertAlmostEqual(s.z_score(0.1587), 1.0, places=3)
        self.assertLess(s.z_score(0.9), 0)

    def test_contoh_prd_snbt(self):
        p = s.proxy_snbt(s.rasio_diterima(HIST_INF), offset=-10)
        self.assertEqual(p["skor_acuan_mentah"], 594.1)
        self.assertEqual(p["offset_diterapkan"], -10)
        self.assertEqual(p["skor_acuan"], 584.1)

    def test_contoh_prd_snbp(self):
        h = [{"tahun": 2024, "daya_tampung": 88, "peminat": 790},
             {"tahun": 2025, "daya_tampung": 90, "peminat": 803}]
        p = s.proxy_snbp(s.rasio_diterima(h))
        self.assertAlmostEqual(p["rapor_acuan_mentah"], 88.48, delta=0.01)
        self.assertEqual(p["rapor_acuan"], p["rapor_acuan_mentah"])

    def test_clamp_skor_acuan(self):
        snbt_low = s.proxy_snbt(0.95)
        self.assertEqual(snbt_low["skor_acuan"], 460.0)    # 515-85*1.645 = 375
        self.assertEqual(snbt_low["acuan_dibatasi"], "bawah")
        snbt_mid = s.proxy_snbt(0.005)
        self.assertEqual(snbt_mid["skor_acuan"], 733.9)   # belum menyentuh 760
        self.assertIsNone(snbt_mid["acuan_dibatasi"])
        snbt_high = s.proxy_snbt(0.005, offset=100)
        self.assertEqual(snbt_high["skor_acuan"], 760.0)
        self.assertEqual(snbt_high["acuan_dibatasi"], "atas")
        snbp_low = s.proxy_snbp(0.95)
        self.assertEqual(snbp_low["rapor_acuan"], 78.0)
        self.assertEqual(snbp_low["acuan_dibatasi"], "bawah")
        snbp_high = s.proxy_snbp(0.005, offset=10)
        self.assertEqual(snbp_high["rapor_acuan"], 96.0)
        self.assertEqual(snbp_high["acuan_dibatasi"], "atas")
        # nilai mentah tidak di-clamp
        self.assertLess(snbt_low["skor_acuan_mentah"], 460)

    def test_offset_butuh_n_laporan_minimal_10(self):
        self.assertEqual(s.offset_aktif(-10, 0), 0)
        self.assertEqual(s.offset_aktif(-10, 9), 0)
        self.assertEqual(s.offset_aktif(-10, 10), -10)
        self.assertEqual(s.offset_aktif(-10, None), 0)


class TestRumpun(unittest.TestCase):
    def cek(self, nama, exp, override=None):
        self.assertEqual(s.classify_rumpun(nama, override), exp, nama)

    def test_pendidikan_dokter_ke_kesehatan(self):
        self.cek("PENDIDIKAN DOKTER", s.R_KESEHATAN)
        self.cek("pendidikan  dokter gigi ", s.R_KESEHATAN)

    def test_prefix_pendidikan(self):
        self.cek("PENDIDIKAN MATEMATIKA", s.R_PENDIDIKAN)
        self.cek("PENDIDIKAN TEKNIK INFORMATIKA", s.R_PENDIDIKAN)
        self.cek("PGSD", s.R_PENDIDIKAN)
        self.cek("PGPAUD", s.R_PENDIDIKAN)

    def test_pertanian_sebelum_ekonomi_dan_teknik(self):
        self.cek("AGRIBISNIS", s.R_PERTANIAN)
        self.cek("AGROEKONOMI", s.R_PERTANIAN)
        self.cek("AGROTEKNOLOGI", s.R_PERTANIAN)
        self.cek("TEKNOLOGI PANGAN", s.R_PERTANIAN)
        self.cek("TEKNIK PERTANIAN", s.R_PERTANIAN)

    def test_kesehatan(self):
        self.cek("KEDOKTERAN HEWAN", s.R_KESEHATAN)
        self.cek("KESEHATAN MASYARAKAT", s.R_KESEHATAN)
        self.cek("FARMASI", s.R_KESEHATAN)

    def test_komputer_sebelum_teknik(self):
        self.cek("TEKNIK INFORMATIKA", s.R_KOMPUTER)
        self.cek("TEKNIK KOMPUTER", s.R_KOMPUTER)
        self.cek("REKAYASA PERANGKAT LUNAK", s.R_KOMPUTER)
        self.cek("SAINS DATA", s.R_KOMPUTER)

    def test_teknik(self):
        self.cek("TEKNIK KIMIA", s.R_TEKNIK)
        self.cek("ARSITEKTUR", s.R_TEKNIK)
        self.cek("REKAYASA KESELAMATAN KEBAKARAN", s.R_TEKNIK)

    def test_ekonomi_vs_sosial(self):
        self.cek("ADMINISTRASI BISNIS", s.R_EKONOMI)
        self.cek("AKUNTANSI", s.R_EKONOMI)
        self.cek("ADMINISTRASI PUBLIK", s.R_SOSHUM)
        self.cek("ILMU HUKUM", s.R_SOSHUM)

    def test_pendidikan_kata_kunci(self):
        self.cek("BIMBINGAN DAN KONSELING", s.R_PENDIDIKAN)
        self.cek("KEPELATIHAN OLAHRAGA", s.R_PENDIDIKAN)

    def test_fallback(self):
        self.cek("MATEMATIKA", s.R_FALLBACK)
        self.cek("FISIKA", s.R_FALLBACK)
        self.cek("STATISTIKA", s.R_FALLBACK)

    def test_override_prioritas_tertinggi(self):
        self.cek("PENDIDIKAN DOKTER", s.R_SOSHUM, override=s.R_SOSHUM)
        self.cek("MATEMATIKA", s.R_KOMPUTER, override=s.R_KOMPUTER)


class TestMerge(unittest.TestCase):
    def test_gabung_dan_buang_peminat_provinsi(self):
        hist = [{"id_prodi": 1, "tahun": 2025, "daya_tampung": 10, "peminat": 100, "terima": None}]
        sb = [{"kode_prodi": 111, "nama": "INFORMATIKA ", "jenjang": "S1", "nama_portofolio": "Tidak Ada",
               "is_new": 0, "daya_tampung_snbt": "12", "history_daya_tampung": hist,
               "history_peminat_provinsi": [{"kode_prov": "102", "jml_peminat": 5}]},
              {"kode_prodi": 222, "nama": "FISIKA", "jenjang": "S1", "is_new": 0,
               "daya_tampung_snbt": "5", "history_daya_tampung": hist}]
        sn = [{"kode_prodi": 111, "nama": "INFORMATIKA", "jenjang": "S1", "is_new": 0,
               "daya_tampung_snbp": "8", "history_daya_tampung": hist}]
        kal = {"111": {"snbt_offset": -10, "snbp_offset": 0, "n_laporan": 12}}
        out = {p["kode_prodi"]: p for p in s.merge_prodi(sb, sn, kal)}

        inf = out["111"]
        self.assertEqual(inf["nama"], "INFORMATIKA")
        self.assertEqual(inf["rumpun"], s.R_KOMPUTER)
        self.assertEqual(inf["snbt"]["kuota_terbaru"], 12)
        self.assertEqual(inf["snbp"]["kuota_terbaru"], 8)
        self.assertEqual(inf["snbt"]["offset_diterapkan"], -10)
        self.assertNotIn("history_peminat_provinsi", str(inf))
        self.assertEqual(out["222"]["snbp"], {"tersedia": False})

    def test_kuota_terbaru_terpisah_dari_rasio(self):
        hist = [{"tahun": 2025, "daya_tampung": 10, "peminat": 100}]
        a = s.build_jalur({"daya_tampung_snbt": "999", "history_daya_tampung": hist}, "snbt", {})
        b = s.build_jalur({"daya_tampung_snbt": "1", "history_daya_tampung": hist}, "snbt", {})
        self.assertEqual(a["rasio_diterima_persen"], b["rasio_diterima_persen"])
        self.assertEqual(a["kuota_terbaru"], 999)


if __name__ == "__main__":
    unittest.main()
