/** Gabungkan className kondisional tanpa dependensi tambahan. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Kelas fokus yang konsisten & terlihat (WCAG 2.4.7). */
export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

/**
 * Tactile Press Soft Neo-Brutalism:
 * - Hover: sedikit terangkat halus (-1px, -1px)
 * - Active: ditekan fisik turun ke kanan-bawah (+3px, +3px) dengan shadow hilang
 * - Hormati prefers-reduced-motion
 */
export const tactileCardButton =
  "shadow-card transition-all duration-150 hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none motion-reduce:transform-none motion-reduce:transition-none";

export const tactileControlButton =
  "shadow-control transition-all duration-150 hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none motion-reduce:transform-none motion-reduce:transition-none";
