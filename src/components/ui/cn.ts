/** Gabungkan className kondisional tanpa dependensi tambahan. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Kelas fokus yang konsisten & terlihat (WCAG 2.4.7). */
export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface";
