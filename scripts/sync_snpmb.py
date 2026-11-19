#!/usr/bin/env python3
"""
sync_snpmb.py — Pipeline data LolosPTN.AI (PRD MVP v1.2.1, Bagian 4).

Menarik data SNBT & SNBP seluruh PTN Jawa Timur (kode_prov1 == "050000") dari
endpoint publik snpmb.id, menggabungkannya per `kode_prodi`, menghitung rasio
diterima tertimbang dan proxy score, mengklasifikasikan rumpun, lalu menulis:

  - data/index.json                : { "dataset_version", "items": [...] } (flat, tanpa historis)
  - public/data/ptn/{id_ptn}.json  : detail & historis per PTN (file statis)

`data/kalibrasi.json` hanya DIBACA (tidak pernah ditimpa).

Hasil verifikasi respons nyata (proxy-prodi-sn.php?ptn=385 & proxy-prodi-sb.php?ptn=385):
  - kuota tahun berjalan : `daya_tampung_snbp` / `daya_tampung_snbt` (string, mis. "105")
  - historis             : `history_daya_tampung` = [{tahun, daya_tampung, peminat, terima}]
  - SNBT juga memuat `history_peminat_provinsi` (dibuang)
  - Daftar PTN: `provinsi` = [{kode_prov1, nama_kota, ...}]

Pemakaian:
  python scripts/sync_snpmb.py
"""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.request
from datetime import date
from pathlib import Path
from statistics import NormalDist
from typing import Any, Iterable

# ---------------------------------------------------------------------------
# Konfigurasi
# ---------------------------------------------------------------------------

BASE_URL = "https://snpmb.id"
URL_PTN = f"{BASE_URL}/proxy-ptn-sb.php"
URL_PRODI_SNBT = f"{BASE_URL}/proxy-prodi-sb.php?ptn={{id_ptn}}"
URL_PRODI_SNBP = f"{BASE_URL}/proxy-prodi-sn.php?ptn={{id_ptn}}"

KODE_PROV_JATIM = "050000"
MAX_TAHUN_HISTORI = 3

# Rasio diterima
BOBOT_TAHUN = (0.5, 0.3, 0.2)  # terbaru, -1, -2
RASIO_MIN = 0.005
RASIO_MAX = 0.95
RASIO_DEFAULT = 0.15

# Proxy score
SNBT_MEAN, SNBT_SD = 515.0, 85.0
SNBP_MEAN, SNBP_SD = 83.0, 4.5
SNBT_MIN, SNBT_MAX = 460.0, 760.0
SNBP_MIN, SNBP_MAX = 78.0, 96.0
MIN_LAPORAN_OFFSET = 10

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
PTN_OUT_DIR = ROOT / "public" / "data" / "ptn"
KALIBRASI_PATH = DATA_DIR / "kalibrasi.json"
INDEX_PATH = DATA_DIR / "index.json"

HTTP_TIMEOUT = 30
HTTP_RETRIES = 3
HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (LolosPTN.AI data sync; non-commercial research)",
    "Accept": "application/json",
}

# ---------------------------------------------------------------------------
# Rumpun (Bagian 4.5) — urutan prioritas, berhenti di kecocokan pertama
# ---------------------------------------------------------------------------

R_KESEHATAN = "Kesehatan & Medis"
R_PENDIDIKAN = "Pendidikan"
R_PERTANIAN = "Pertanian & Hayati"
R_KOMPUTER = "Komputer & IT"
R_TEKNIK = "Teknik & Rekayasa"
R_EKONOMI = "Ekonomi & Bisnis"
R_SOSHUM = "Sosial, Hukum & Humaniora"
R_FALLBACK = "Sains & Umum"

# Langkah 2–8 (kata kunci dicocokkan sebagai substring pada nama ter-normalisasi)
RUMPUN_KEYWORDS: list[tuple[str, tuple[str, ...]]] = [
    (R_PERTANIAN, ("AGRO", "AGRIBISNIS", "PERTANIAN", "PETERNAKAN", "PERIKANAN",
                   "KELAUTAN", "PERAIRAN", "KEHUTANAN", "TEKNOLOGI PANGAN")),
    (R_KESEHATAN, ("DOKTER", "KEDOKTERAN", "FARMASI", "KEPERAWATAN", "KESEHATAN",
                   "GIZI", "KEBIDANAN", "FISIOTERAPI")),
    (R_KOMPUTER, ("INFORMATIKA", "SISTEM INFORMASI", "ILMU KOMPUTER", "TEKNIK KOMPUTER",
                  "SAINS DATA", "TEKNOLOGI INFORMASI", "REKAYASA PERANGKAT",
                  "KECERDASAN BUATAN")),
    (R_TEKNIK, ("TEKNIK", "ARSITEKTUR", "PERENCANAAN WILAYAH", "GEOMATIKA",
                "METALURGI", "REKAYASA")),
    (R_EKONOMI, ("MANAJEMEN", "AKUNTANSI", "EKONOMI", "BISNIS", "KEUANGAN",
                 "PERPAJAKAN", "ADMINISTRASI BISNIS", "ADMINISTRASI NIAGA")),
    (R_PENDIDIKAN, ("KEPELATIHAN", "BIMBINGAN DAN KONSELING")),
    (R_SOSHUM, ("HUKUM", "KOMUNIKASI", "HUBUNGAN INTERNASIONAL", "SOSIOLOGI",
                "PSIKOLOGI", "POLITIK", "ADMINISTRASI PUBLIK", "SASTRA", "BAHASA",
                "SEJARAH", "DESAIN", "SENI")),
]


def normalize_name(nama: Any) -> str:
    """Upper-case, trim, dan rapikan spasi ganda."""
    return re.sub(r"\s+", " ", str(nama or "")).strip().upper()


def classify_rumpun(nama: str, rumpun_override: str | None = None) -> str:
    """Klasifikasi rumpun sesuai urutan prioritas PRD Bagian 4.5."""
    # 0. Override manual dari kalibrasi.json
    if rumpun_override:
        return rumpun_override

    n = normalize_name(nama)

    # 1. Aturan khusus (prefix)
    if n.startswith("PENDIDIKAN DOKTER"):
        return R_KESEHATAN
    if n.startswith("PENDIDIKAN") or n.startswith("PGSD") or n.startswith("PGPAUD"):
        return R_PENDIDIKAN

    # 2–8. Kata kunci
    for rumpun, keywords in RUMPUN_KEYWORDS:
        if any(k in n for k in keywords):
            return rumpun

    # 9. Fallback
    return R_FALLBACK


# ---------------------------------------------------------------------------
# Rumus
# ---------------------------------------------------------------------------


def clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def _to_int(v: Any) -> int | None:
    if v is None:
        return None
    try:
        s = str(v).strip()
        if s == "":
            return None
        return int(float(s))
    except (TypeError, ValueError):
        return None


def select_historis(history: Iterable[dict] | None, max_years: int = MAX_TAHUN_HISTORI) -> list[dict]:
    """
    Ambil maksimal `max_years` tahun terakhir yang LENGKAP (daya_tampung & peminat > 0),
    urut menaik berdasarkan tahun. Field lain (id_prodi, terima) dibuang.
    """
    by_year: dict[int, dict] = {}
    for h in history or []:
        tahun = _to_int(h.get("tahun"))
        dt = _to_int(h.get("daya_tampung"))
        pm = _to_int(h.get("peminat"))
        if tahun is None or not dt or not pm or dt <= 0 or pm <= 0:
            continue
        by_year[tahun] = {"tahun": tahun, "daya_tampung": dt, "peminat": pm}
    tahun_urut = sorted(by_year)[-max_years:] if max_years > 0 else []
    return [by_year[t] for t in tahun_urut]


def rasio_diterima(historis: list[dict], is_new: int = 0) -> float:
    """
    Rasio diterima tertimbang (terbaru 50%, -1 30%, -2 20%; dinormalisasi jika < 3 tahun).
    Tiap rasio tahunan di-clamp 0.005–0.95. Prodi baru / histori kosong → 0.15.
    """
    if is_new == 1 or not historis:
        return RASIO_DEFAULT
    terbaru_dulu = sorted(historis, key=lambda h: h["tahun"], reverse=True)[: len(BOBOT_TAHUN)]
    total_w = 0.0
    acc = 0.0
    for w, h in zip(BOBOT_TAHUN, terbaru_dulu):
        r = clamp(h["daya_tampung"] / h["peminat"], RASIO_MIN, RASIO_MAX)
        acc += w * r
        total_w += w
    return clamp(acc / total_w, RASIO_MIN, RASIO_MAX)


def z_score(rasio: float) -> float:
    """Z = NormalDist().inv_cdf(1 - rasio_diterima)."""
    return NormalDist().inv_cdf(1 - clamp(rasio, RASIO_MIN, RASIO_MAX))


def offset_aktif(offset: Any, n_laporan: Any) -> float:
    """Offset hanya diterapkan jika n_laporan >= 10."""
    n = _to_int(n_laporan) or 0
    if n < MIN_LAPORAN_OFFSET:
        return 0
    try:
        return float(offset or 0)
    except (TypeError, ValueError):
        return 0


def proxy_snbt(rasio: float, offset: float = 0) -> dict:
    mentah = SNBT_MEAN + SNBT_SD * z_score(rasio)
    acuan = clamp(mentah + offset, SNBT_MIN, SNBT_MAX)
    return {
        "skor_acuan_mentah": round(mentah, 1),
        "offset_diterapkan": _offset_out(offset),
        "skor_acuan": round(acuan, 1),
    }


def proxy_snbp(rasio: float, offset: float = 0) -> dict:
    mentah = SNBP_MEAN + SNBP_SD * z_score(rasio)
    acuan = clamp(mentah + offset, SNBP_MIN, SNBP_MAX)
    return {
        "rapor_acuan_mentah": round(mentah, 2),
        "offset_diterapkan": _offset_out(offset),
        "rapor_acuan": round(acuan, 2),
    }


def _offset_out(offset: float) -> float | int:
    return int(offset) if float(offset).is_integer() else round(offset, 2)


# ---------------------------------------------------------------------------
# Pembangunan objek
# ---------------------------------------------------------------------------


def build_jalur(raw: dict | None, jalur: str, kal: dict) -> dict:
    """Bangun objek `snbt` / `snbp` untuk satu prodi."""
    if raw is None:
        return {"tersedia": False}

    historis = select_historis(raw.get("history_daya_tampung"))
    is_new = _to_int(raw.get("is_new")) or 0
    r = rasio_diterima(historis, is_new)
    kuota = _to_int(raw.get(f"daya_tampung_{jalur}"))

    obj: dict[str, Any] = {
        "tersedia": True,
        "kuota_terbaru": kuota,
        "rasio_diterima_persen": round(r * 100, 2),
    }
    if jalur == "snbt":
        off = offset_aktif(kal.get("snbt_offset"), kal.get("n_laporan"))
        obj.update(proxy_snbt(r, off))
    else:
        off = offset_aktif(kal.get("snbp_offset"), kal.get("n_laporan"))
        obj.update(proxy_snbp(r, off))
    obj["historis"] = historis
    return obj


def merge_prodi(snbt_list: list[dict], snbp_list: list[dict], kalibrasi: dict) -> list[dict]:
    """
    Gabungkan prodi SNBT & SNBP berdasarkan `kode_prodi`.
    `history_peminat_provinsi` dibuang (tidak pernah disalin).
    """
    snbt_by = {str(p["kode_prodi"]).strip(): p for p in snbt_list or [] if p.get("kode_prodi") is not None}
    snbp_by = {str(p["kode_prodi"]).strip(): p for p in snbp_list or [] if p.get("kode_prodi") is not None}

    hasil = []
    for kode in sorted(set(snbt_by) | set(snbp_by)):
        sb = snbt_by.get(kode)
        sn = snbp_by.get(kode)
        base = sb or sn
        kal = kalibrasi.get(kode) or {}
        nama = normalize_name(base.get("nama"))
        is_new = 1 if any((_to_int(x.get("is_new")) or 0) == 1 for x in (sb, sn) if x) else 0
        hasil.append({
            "kode_prodi": kode,
            "nama": nama,
            "jenjang": str(base.get("jenjang") or "").strip(),
            "rumpun": classify_rumpun(nama, kal.get("rumpun_override")),
            "nama_portofolio": str(base.get("nama_portofolio") or "Tidak Ada").strip(),
            "is_new": is_new,
            "snbt": build_jalur(sb, "snbt", kal),
            "snbp": build_jalur(sn, "snbp", kal),
        })
    return hasil


def is_jatim(ptn: dict) -> bool:
    return any(str(p.get("kode_prov1")) == KODE_PROV_JATIM for p in ptn.get("provinsi") or [])


def kota_ptn(ptn: dict) -> str:
    for p in ptn.get("provinsi") or []:
        if str(p.get("kode_prov1")) == KODE_PROV_JATIM:
            return str(p.get("nama_kota") or "").strip()
    return ""


def index_item(ptn_obj: dict, prodi: dict) -> dict:
    def ringkas(j: dict, key: str) -> dict:
        if not j.get("tersedia"):
            return {"tersedia": False}
        return {"tersedia": True, key: j[key], "jumlah_tahun_histori": len(j["historis"])}

    return {
        "id_ptn": ptn_obj["id_ptn"],
        "nama_ptn": ptn_obj["nama_ptn"],
        "kode_prodi": prodi["kode_prodi"],
        "nama": prodi["nama"],
        "jenjang": prodi["jenjang"],
        "rumpun": prodi["rumpun"],
        "is_new": prodi["is_new"],
        "snbt": ringkas(prodi["snbt"], "skor_acuan"),
        "snbp": ringkas(prodi["snbp"], "rapor_acuan"),
    }


# ---------------------------------------------------------------------------
# I/O
# ---------------------------------------------------------------------------


def fetch_json(url: str) -> Any:
    last_err: Exception | None = None
    for attempt in range(1, HTTP_RETRIES + 1):
        try:
            req = urllib.request.Request(url, headers=HTTP_HEADERS)
            with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
                return json.loads(resp.read().decode("utf-8-sig"))
        except Exception as e:  # noqa: BLE001
            last_err = e
            time.sleep(1.5 * attempt)
    raise RuntimeError(f"Gagal mengambil {url}: {last_err}")


def load_kalibrasi(path: Path = KALIBRASI_PATH) -> dict:
    if not path.exists():
        return {}
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    return {str(k): v for k, v in data.items() if isinstance(v, dict)}


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8", newline="\n") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write("\n")
    tmp.replace(path)


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    kalibrasi = load_kalibrasi()
    print(f"[i] Kalibrasi dimuat: {len(kalibrasi)} entri")

    ptn_all = fetch_json(URL_PTN)
    ptn_jatim = sorted((p for p in ptn_all if is_jatim(p)), key=lambda p: p["id_ptn"])
    print(f"[i] PTN Jawa Timur: {len(ptn_jatim)} dari {len(ptn_all)} PTN")

    # Kumpulkan semua data dulu; tulis hanya jika seluruh fetch berhasil
    # (snapshot lama tetap aman bila endpoint gagal).
    ptn_objs: list[dict] = []
    for p in ptn_jatim:
        id_ptn = int(p["id_ptn"])
        snbt = fetch_json(URL_PRODI_SNBT.format(id_ptn=id_ptn)) or []
        snbp = fetch_json(URL_PRODI_SNBP.format(id_ptn=id_ptn)) or []
        prodi_list = merge_prodi(snbt, snbp, kalibrasi)
        ptn_objs.append({
            "id_ptn": id_ptn,
            "nama_ptn": str(p.get("nama") or "").strip(),
            "kota": kota_ptn(p),
            "prodi_list": prodi_list,
        })
        print(f"    - {id_ptn} {p.get('nama')}: SNBT {len(snbt)}, SNBP {len(snbp)}, gabungan {len(prodi_list)}")

    ptn_objs = [o for o in ptn_objs if o["prodi_list"]]
    if not ptn_objs:
        print("[!] Tidak ada data prodi. Output tidak ditulis.")
        return 1

    # Tulis per-PTN (hapus file lama hasil generate agar tidak ada sisa)
    PTN_OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in PTN_OUT_DIR.glob("*.json"):
        if old.stem.isdigit():
            old.unlink()
    for o in ptn_objs:
        write_json(PTN_OUT_DIR / f"{o['id_ptn']}.json", o)

    items = [index_item(o, pr) for o in ptn_objs for pr in o["prodi_list"]]
    write_json(INDEX_PATH, {"dataset_version": date.today().isoformat(), "items": items})

    # Ringkasan
    n_snbt = sum(1 for i in items if i["snbt"]["tersedia"])
    n_snbp = sum(1 for i in items if i["snbp"]["tersedia"])
    print(f"\n[OK] {len(ptn_objs)} PTN, {len(items)} prodi (SNBT: {n_snbt}, SNBP: {n_snbp})")
    print(f"     -> {INDEX_PATH.relative_to(ROOT)}")
    print(f"     -> {PTN_OUT_DIR.relative_to(ROOT)}/{{id_ptn}}.json")

    rumpun_count: dict[str, int] = {}
    for i in items:
        rumpun_count[i["rumpun"]] = rumpun_count.get(i["rumpun"], 0) + 1
    print("\n[i] Distribusi rumpun:")
    for k, v in sorted(rumpun_count.items(), key=lambda kv: -kv[1]):
        print(f"    {v:4d}  {k}")

    fallback = [i for i in items if i["rumpun"] == R_FALLBACK]
    print(f"\n[!] Prodi fallback '{R_FALLBACK}' ({len(fallback)}) — tinjau & override di data/kalibrasi.json bila perlu:")
    for i in fallback:
        print(f"    {i['kode_prodi']}  {i['jenjang']:<4} {i['nama']}  ({i['nama_ptn']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
