/**
 * Konfigurasi tema LolosPTN.AI (PRD Bagian 7.3).
 * P0: tema aktif dikunci "light". Dark mode, preset tema, dan density = P2.
 */

import { copy } from "@/config/copy";

export type ThemeMode = "light" | "dark" | "system";
export type CardStyle = "flat" | "elevated" | "outlined";
export type ResultSection = "hasil" | "insights" | "tren" | "callout" | "paywall";

export const THEME = {
  /** Tema aktif; nilai ini dipasang ke atribut `data-theme` pada <html>. */
  activeTheme: "light" as ThemeMode,

  brandName: copy.hero.brand,
  logo: null as string | null,
  favicon: "/favicon.ico",

  metadata: {
    title: copy.meta.title,
    description: copy.meta.description,
    lang: "id",
    locale: "id_ID",
  },

  /** Gaya kartu default (varian lain disiapkan untuk P2). */
  cardStyle: "elevated" as CardStyle,

  /** Urutan bagian halaman hasil; ubah urutan cukup di sini. */
  resultLayoutOrder: [
    "hasil",
    "paywall",
    "insights",
    "tren",
    "callout",
  ] as readonly ResultSection[],
} as const;
