"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { copy } from "@/config/copy";
import { Badge, Card, cn, focusRing, tactileCardButton } from "@/components/ui";

const EASE_SNAPPY = [0.22, 1, 0.36, 1] as const;

export function HeroSection() {
  const { preview } = copy.hero;
  const prefersReduced = useReducedMotion();

  return (
    <section
      id="top"
      className="mx-auto w-full max-w-6xl px-4 pt-8 pb-10 sm:px-6 sm:pt-14 sm:pb-16 lg:px-8"
    >
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Kolom Kiri: Pitch & CTA dengan animasi masuk singkat */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_SNAPPY }}
          className="flex flex-col items-start gap-5 lg:col-span-6"
        >
          <p className="inline-flex items-center gap-2 rounded-full border-2 border-line bg-callout-bg px-3.5 py-1.5 text-xs font-bold text-fg shadow-pill sm:text-sm">
            <span
              aria-hidden="true"
              className="size-2 rounded-full border border-line bg-brand"
            />
            <span>{copy.hero.pill}</span>
          </p>

          <h1 className="font-display text-3xl leading-[1.12] font-bold tracking-tight text-fg sm:text-5xl">
            {copy.hero.title}
          </h1>

          <p className="text-sm leading-relaxed font-medium text-fg-muted sm:text-base lg:text-lg">
            {copy.hero.subtitle}
          </p>

          <div className="flex w-full flex-col items-stretch gap-3 pt-1 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/kalkulator"
              className={cn(
                "group inline-flex min-h-13 items-center justify-center gap-2 rounded-control border-2 border-line bg-brand px-6 text-base font-bold text-brand-fg hover:bg-brand-hover",
                tactileCardButton,
                focusRing
              )}
            >
              <span>{copy.hero.cta}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 transition-transform duration-150 group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none"
              >
                <path d="M4 10h12M11 5l5 5-5 5" />
              </svg>
            </Link>

            <p className="text-center text-xs font-semibold text-fg-muted sm:text-left">
              {copy.hero.trustNote}
            </p>
          </div>
        </motion.div>

        {/* Kolom Kanan: Kartu Preview Hasil Realistis dengan progress bar terisi otomatis */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: EASE_SNAPPY }}
          className="lg:col-span-6"
        >
          <Card as="div" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-display text-xs font-bold tracking-wide text-fg-muted">
                {preview.header}
              </p>
              <span className="rounded-lg border-2 border-line bg-surface-muted px-2.5 py-0.5 font-display text-xs font-bold text-fg">
                {preview.scoreChip}
              </span>
            </div>

            {/* Pilihan 1 Preview */}
            <div className="space-y-2.5 rounded-control border-2 border-line bg-surface-warm p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-wider text-fg-subtle">
                    {preview.choice1Eyebrow}
                  </p>
                  <p className="text-sm font-bold text-fg sm:text-base">
                    {preview.choice1Name}
                  </p>
                </div>
                <Badge status="target" size="sm" />
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-3xl font-bold tracking-tight text-fg">
                  {preview.choice1Percent}
                </p>
                <p className="text-xs font-medium text-fg-muted">
                  {preview.choice1Range}
                </p>
              </div>

              <div
                aria-hidden="true"
                className="h-3.5 w-full overflow-hidden rounded-full border-2 border-line bg-surface"
              >
                <motion.div
                  initial={prefersReduced ? false : { width: "0%" }}
                  animate={{ width: "58%" }}
                  transition={{
                    duration: 0.75,
                    delay: 0.22,
                    ease: EASE_SNAPPY,
                  }}
                  className="h-full border-r-2 border-line bg-status-target-soft"
                />
              </div>
            </div>

            {/* Pilihan 2 Preview */}
            <div className="space-y-2.5 rounded-control border-2 border-line bg-surface-warm p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-wider text-fg-subtle">
                    {preview.choice2Eyebrow}
                  </p>
                  <p className="text-sm font-bold text-fg sm:text-base">
                    {preview.choice2Name}
                  </p>
                </div>
                <Badge status="safe" size="sm" />
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-3xl font-bold tracking-tight text-fg">
                  {preview.choice2Percent}
                </p>
                <p className="text-xs font-medium text-fg-muted">
                  {preview.choice2Range}
                </p>
              </div>

              <div
                aria-hidden="true"
                className="h-3.5 w-full overflow-hidden rounded-full border-2 border-line bg-surface"
              >
                <motion.div
                  initial={prefersReduced ? false : { width: "0%" }}
                  animate={{ width: "90%" }}
                  transition={{
                    duration: 0.8,
                    delay: 0.34,
                    ease: EASE_SNAPPY,
                  }}
                  className="h-full border-r-2 border-line bg-status-safe-soft"
                />
              </div>
            </div>

            {/* Footer Strip AI & Alternatif */}
            <div className="flex items-center gap-3 rounded-control border-2 border-line bg-ai-header px-3.5 py-3">
              <span
                aria-hidden="true"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg border-2 border-line bg-brand text-brand-fg"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </span>
              <p className="text-xs font-bold text-fg sm:text-sm">
                {preview.footerStrip}
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
