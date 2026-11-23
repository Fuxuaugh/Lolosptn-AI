"use client";

import { motion } from "framer-motion";
import type { RecommendResponseBody } from "@/app/api/recommend/route";
import type { Jalur } from "@/config/app.config";
import { copy } from "@/config/copy";
import { Badge, Button, Card, Skeleton } from "@/components/ui";

const EASE_SNAPPY = [0.22, 1, 0.36, 1] as const;

export interface FreeInsightsCardProps {
  jalur: Jalur;
  data: RecommendResponseBody | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  /** Jika true, render tanpa wrapper Card luar (dipakai di dalam tab detail). */
  embedded?: boolean;
}

function formatPercent(value: number): string {
  return String(Math.round(value));
}

export function FreeInsightsCard({
  jalur,
  data,
  loading,
  error,
  onRetry,
  embedded = false,
}: FreeInsightsCardProps) {
  const paragraphs = data
    ? data.summary
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  const bodyContent = loading ? (
    <div className="space-y-3" role="status" aria-busy="true">
      <p className="text-xs font-semibold text-fg-muted">
        {copy.freeInsights.loading}
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-2.5 lg:col-span-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="space-y-2.5 lg:col-span-6">
          <Skeleton className="h-14 w-full rounded-control" />
          <Skeleton className="h-14 w-full rounded-control" />
        </div>
      </div>
    </div>
  ) : error || !data ? (
    <div className="flex flex-col items-start gap-3">
      <p role="alert" className="text-sm font-medium text-fg-muted">
        {copy.freeInsights.error}
      </p>
      <Button variant="secondary" onClick={onRetry}>
        {copy.error.retry}
      </Button>
    </div>
  ) : (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Kolom Kiri: Ringkasan Otomatis (template deterministik, bukan AI) */}
      <div className="min-w-0 space-y-3 lg:col-span-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xs font-bold tracking-wider text-fg-muted uppercase">
              {copy.freeInsights.summaryTitle}
            </h3>
            <p className="mt-0.5 text-xs text-fg-muted">
              {copy.freeInsights.summarySubtitle}
            </p>
          </div>
          <span className="shrink-0 rounded-full border-2 border-line bg-status-safe-soft px-2.5 py-0.5 text-xs font-bold text-status-safe-fg">
            {copy.freeInsights.chip}
          </span>
        </div>
        <div className="space-y-2.5 text-sm leading-relaxed text-fg">
          {paragraphs.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      </div>

      {/* Kolom Kanan: 3 Alternatif Prodi Serumpun (Gratis) */}
      <div className="min-w-0 space-y-3 rounded-control border-2 border-line bg-surface-warm p-3.5 sm:p-4 lg:col-span-6">
        <div>
          <h3 className="font-display text-xs font-bold tracking-wider text-fg-muted uppercase">
            {copy.freeInsights.alternativesTitle}
          </h3>
          <p className="mt-0.5 text-xs text-fg-muted">
            {copy.freeInsights.alternativesSubtitle}
          </p>
        </div>

        {data.alternatives.length === 0 ? (
          <p className="text-sm font-medium text-fg-muted">
            {copy.fallback.noAlternatives}
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {data.alternatives.map(({ prodi, prediction }) => (
              <li
                key={prodi.kode_prodi}
                className="rounded-control border-2 border-line bg-surface p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm leading-snug font-bold text-fg">
                      {prodi.nama} ({prodi.jenjang})
                    </p>
                    <p className="mt-0.5 break-words text-xs font-medium text-fg-muted">
                      {prodi.nama_ptn}
                    </p>
                  </div>
                  <Badge
                    status={prediction.status}
                    size="sm"
                    className="shrink-0"
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-line-soft pt-2 text-xs">
                  <p className="font-bold text-fg tabular-nums">
                    {copy.hasil.peluangLabel}:{" "}
                    <span className="font-display text-sm">
                      {copy.hasil.peluang(
                        formatPercent(prediction.probability)
                      )}
                    </span>{" "}
                    <span className="font-medium text-fg-muted">
                      (
                      {copy.hasil.rentangSensitivitas(
                        formatPercent(prediction.pLow),
                        formatPercent(prediction.pHigh)
                      )}
                      )
                    </span>
                  </p>
                  <p className="font-medium text-fg-muted tabular-nums">
                    {copy.paywall.refScoreShort(
                      jalur,
                      prediction.referenceScore
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return (
      <motion.section
        aria-label={copy.freeInsights.title}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: EASE_SNAPPY }}
      >
        {bodyContent}
      </motion.section>
    );
  }

  return (
    <motion.section
      aria-label={copy.freeInsights.title}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE_SNAPPY }}
    >
      <Card as="article" noPadding className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-line bg-surface-muted px-4 py-3.5 sm:px-5">
          <h2 className="font-display text-base font-bold tracking-tight text-fg sm:text-lg">
            {copy.freeInsights.title}
          </h2>
          <span className="rounded-full border-2 border-line bg-status-safe-soft px-3 py-0.5 text-xs font-bold text-status-safe-fg">
            {copy.freeInsights.chip}
          </span>
        </div>

        <div className="bg-surface p-4 sm:p-5">{bodyContent}</div>
      </Card>
    </motion.section>
  );
}
