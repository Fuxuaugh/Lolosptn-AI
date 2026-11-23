"use client";

import { motion } from "framer-motion";
import type { AnalyzeResponseBody } from "@/app/api/analyze/route";
import type { Jalur } from "@/config/app.config";
import { copy } from "@/config/copy";
import { Badge, Callout, Card } from "@/components/ui";

const EASE_SNAPPY = [0.22, 1, 0.36, 1] as const;

export interface UnlockedAnalysisProps {
  jalur: Jalur;
  data: AnalyzeResponseBody;
  /** Sembunyikan daftar 3 alternatif jika sudah tampil di panel gratis agar tidak duplikat. */
  hideAlternatives?: boolean;
}

function formatPercent(value: number): string {
  return String(Math.round(value));
}

export function UnlockedAnalysis({
  jalur,
  data,
  hideAlternatives = false,
}: UnlockedAnalysisProps) {
  const paragraphs = data.analysis
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <motion.section
      aria-label={copy.paywall.unlockedTitle}
      initial={{ opacity: 0, y: 14, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.32, ease: EASE_SNAPPY }}
    >
      {/* F6: Kartu "Strategi dari AI" (header ungu lembut, isi putih) */}
      <Card as="article" noPadding className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-line bg-ai-header px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-line bg-brand text-brand-fg"
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
            <h2 className="font-display text-base font-bold tracking-tight text-fg sm:text-lg">
              {copy.paywall.aiTitle}
            </h2>
          </div>

          <span className="shrink-0 rounded-full border-2 border-line bg-surface px-3 py-0.5 text-xs font-bold text-brand shadow-pill">
            {copy.paywall.aiChip}
          </span>
        </div>

        {/* Body Putih Bersih */}
        <div className="space-y-4 bg-surface p-4 sm:p-5">
          {data.isFallback && (
            <Callout tone="info" title={copy.fallback.aiUnavailable}>
              <p>{copy.fallback.aiUnavailableBody}</p>
            </Callout>
          )}

          {data.cached && !data.isFallback && (
            <p className="inline-flex items-center rounded-md border border-line-soft bg-surface-muted px-2.5 py-1 text-xs font-semibold text-fg-muted">
              {copy.paywall.cachedBadge}
            </p>
          )}

          <div className="space-y-3 text-sm leading-relaxed text-fg sm:text-[15px]">
            {paragraphs.map((paragraph, idx) => (
              <motion.p
                key={idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.24,
                  delay: 0.06 + idx * 0.05,
                  ease: EASE_SNAPPY,
                }}
              >
                {paragraph}
              </motion.p>
            ))}
          </div>

          {/* F5 opsional (hanya jika tidak ditampilkan di FreeInsightsCard) */}
          {!hideAlternatives && (
            <div className="space-y-3 rounded-control border-2 border-line bg-surface-warm p-3.5 sm:p-4">
              <div>
                <h3 className="font-display text-xs font-bold tracking-wider text-fg-muted uppercase">
                  {copy.paywall.alternativesTitle}
                </h3>
                <p className="mt-0.5 text-xs text-fg-muted">
                  {copy.paywall.alternativesSubtitle}
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

                      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line-soft pt-2 text-xs">
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
          )}
        </div>

        {/* Pengingat screenshot wajib (PRD Bagian 5 F4) — ringkas di footer kartu */}
        <div className="border-t-2 border-line bg-callout-bg px-4 py-3 text-xs leading-relaxed font-medium text-callout-fg sm:px-5">
          <strong className="font-bold">
            {copy.paywall.screenshotReminderTitle}:
          </strong>{" "}
          {copy.paywall.screenshotReminder}
        </div>
      </Card>
    </motion.section>
  );
}
