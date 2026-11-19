/**
 * Dataset loader & definisi tipe data LolosPTN.AI.
 * Selaras 100% dengan skema output `scripts/sync_snpmb.py`:
 *   - `data/index.json` (static import agar ikut ter-bundle di Vercel Serverless)
 *   - `public/data/ptn/{id_ptn}.json` (di-fetch client-side sesuai kebutuhan)
 */

import rawDatasetIndex from "../../data/index.json";
import type { Jalur } from "@/config/app.config";

// ---------------------------------------------------------------------------
// Tipe skema `data/index.json`
// ---------------------------------------------------------------------------

export interface JalurUnavailable {
  tersedia: false;
}

export interface IndexSnbtAvailable {
  tersedia: true;
  skor_acuan: number;
  jumlah_tahun_histori: number;
}

export interface IndexSnbpAvailable {
  tersedia: true;
  rapor_acuan: number;
  jumlah_tahun_histori: number;
}

export type IndexSnbt = IndexSnbtAvailable | JalurUnavailable;
export type IndexSnbp = IndexSnbpAvailable | JalurUnavailable;

export interface ProdiIndexItem {
  id_ptn: number;
  nama_ptn: string;
  kode_prodi: string;
  nama: string;
  jenjang: string;
  rumpun: string;
  is_new: 0 | 1;
  snbt: IndexSnbt;
  snbp: IndexSnbp;
}

export interface DatasetIndex {
  dataset_version: string;
  items: ProdiIndexItem[];
}

// ---------------------------------------------------------------------------
// Tipe skema `public/data/ptn/{id_ptn}.json`
// ---------------------------------------------------------------------------

export interface HistorisTahun {
  tahun: number;
  daya_tampung: number;
  peminat: number;
}

export interface DetailSnbtAvailable {
  tersedia: true;
  kuota_terbaru: number | null;
  rasio_diterima_persen: number;
  skor_acuan_mentah: number;
  offset_diterapkan: number;
  skor_acuan: number;
  historis: HistorisTahun[];
}

export interface DetailSnbpAvailable {
  tersedia: true;
  kuota_terbaru: number | null;
  rasio_diterima_persen: number;
  rapor_acuan_mentah: number;
  offset_diterapkan: number;
  rapor_acuan: number;
  historis: HistorisTahun[];
}

export type DetailSnbt = DetailSnbtAvailable | JalurUnavailable;
export type DetailSnbp = DetailSnbpAvailable | JalurUnavailable;

export interface ProdiDetail {
  kode_prodi: string;
  nama: string;
  jenjang: string;
  rumpun: string;
  nama_portofolio: string;
  is_new: 0 | 1;
  snbt: DetailSnbt;
  snbp: DetailSnbp;
}

export interface PtnDetail {
  id_ptn: number;
  nama_ptn: string;
  kota: string;
  prodi_list: ProdiDetail[];
}

export interface PtnSummary {
  id_ptn: number;
  nama_ptn: string;
}

// ---------------------------------------------------------------------------
// Data statis & helper query
// ---------------------------------------------------------------------------

const datasetIndex = rawDatasetIndex as DatasetIndex;

export const DATASET_VERSION: string = datasetIndex.dataset_version;
export const DATASET_ITEMS: readonly ProdiIndexItem[] = datasetIndex.items;

export function getDatasetIndex(): DatasetIndex {
  return datasetIndex;
}

/**
 * Mengembalikan daftar PTN unik dari `data/index.json`.
 * Jika `jalur` diberikan, hanya menyertakan PTN yang memiliki minimal 1 prodi
 * dengan `tersedia: true` pada jalur tersebut.
 */
export function getPtnList(
  jalur?: Jalur,
  items: readonly ProdiIndexItem[] = DATASET_ITEMS
): PtnSummary[] {
  const seen = new Map<number, string>();

  for (const item of items) {
    if (jalur && !item[jalur].tersedia) {
      continue;
    }
    if (!seen.has(item.id_ptn)) {
      seen.set(item.id_ptn, item.nama_ptn);
    }
  }

  return Array.from(seen.entries())
    .map(([id_ptn, nama_ptn]) => ({ id_ptn, nama_ptn }))
    .sort((a, b) => a.nama_ptn.localeCompare(b.nama_ptn, "id"));
}

/**
 * Memfilter prodi yang tersedia (`tersedia: true`) pada jalur terpilih.
 * Opsional dapat disaring lagi berdasarkan `idPtn`.
 */
export function getProdiByJalur(
  jalur: Jalur,
  idPtn?: number,
  items: readonly ProdiIndexItem[] = DATASET_ITEMS
): ProdiIndexItem[] {
  return items.filter((item) => {
    if (!item[jalur].tersedia) return false;
    if (idPtn !== undefined && item.id_ptn !== idPtn) return false;
    return true;
  });
}

/**
 * Mencari satu prodi di `data/index.json` berdasarkan `kode_prodi`.
 */
export function findProdiByKode(
  kodeProdi: string,
  items: readonly ProdiIndexItem[] = DATASET_ITEMS
): ProdiIndexItem | undefined {
  return items.find((item) => item.kode_prodi === kodeProdi);
}

const ptnDetailCache = new Map<number, Promise<PtnDetail>>();

/**
 * Helper client-side untuk memuat detail & data historis satu PTN
 * dari file statis `/data/ptn/{id_ptn}.json` dengan deduplikasi cache per sesi.
 */
export function fetchPtnDetail(idPtn: number): Promise<PtnDetail> {
  if (!Number.isInteger(idPtn) || idPtn <= 0) {
    return Promise.reject(new Error(`Invalid PTN ID: ${String(idPtn)}`));
  }

  const cached = ptnDetailCache.get(idPtn);
  if (cached) {
    return cached;
  }

  const request = fetch(`/data/ptn/${idPtn}.json`, {
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Failed to fetch PTN detail for ${idPtn}: HTTP ${response.status}`
        );
      }
      return (await response.json()) as PtnDetail;
    })
    .catch((err) => {
      ptnDetailCache.delete(idPtn);
      throw err;
    });

  ptnDetailCache.set(idPtn, request);
  return request;
}
