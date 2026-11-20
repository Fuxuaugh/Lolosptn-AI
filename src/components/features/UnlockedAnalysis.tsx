"use client";

import type { AnalyzeResponseBody } from "@/app/api/analyze/route";
import type { Jalur } from "@/config/app.config";
import { copy } from "@/config/copy";
import { Badge, Callout, Card } from "@/components/ui";

export interface UnlockedAnalysisProps {
  jalur: Jalur;
  data: AnalyzeResponseBody;
}

function formatPercent(value: number): string {
  return String(Math.round(value));
}

export function UnlockedAnalysis({ jalur, data }: UnlockedAnalysisProps) {
  const paragraphs = data.analysis
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section
      aria-label={copy.paywall.unlockedTitle}
      className="flex flex-col gap-5"
    >
      {/* Pengingat screenshot wajib (PRD Bagian 5 F4) */}
      <Callout tone="warning" title={copy.paywall.screenshotReminderTitle}>
        <p>{copy.paywall.screenshotReminder}</p>
      </Callout>

      {/* F6: Kartu "Strategi dari AI" (header ungu lembut #EEF2FF, isi putih 3 paragraf) + F5 */}
      <Card as="article" noPadding className="overflow-hidden">
        {/* Header #EEF2FF */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-line bg-ai-header px-5 py-4">
          <div className="flex items-center gap-2.5">
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
            <h3 className="font-display text-lg font-bold tracking-tight text-fg">
              {copy.paywall.aiTitle}
            </h3>
          </div>

          <span className="rounded-full border-2 border-line bg-surface px-3 py-0.5 text-xs font-bold text-brand">
            {copy.paywall.aiChip}
          </span>
        </div>

        {/* Body Putih Bersih */}
        <div className="space-y-5 bg-surface p-5">
          {data.isFallback && (
            <Callout tone="info" title={copy.fallback.aiUnavailable}>
              <p>{copy.fallback.aiUnavailableBody}</p>
            </Callout>
          )}

          {data.cached && !data.isFallback && (
            <p className="text-xs font-semibold text-fg-muted">
              {copy.paywall.cachedBadge}
            </p>
          )}

          <div className="space-y-3.5 text-sm leading-relaxed text-fg">
            {paragraphs.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {/* F5: Rekomendasi Prodi Alternatif Serumpun */}
          <div className="space-y-3 rounded-control border-2 border-line bg-surface-warm p-4">
            <div>
              <h4 className="font-display text-xs font-bold tracking-wider text-fg-muted uppercase">
                {copy.paywall.alternativesTitle}
              </h4>
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
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-fg">
                          {prodi.nama} ({prodi.jenjang})
                        </p>
                        <p className="text-xs font-medium text-fg-muted">
                          {prodi.nama_ptn}
                        </p>
                      </div>
                      <Badge status={prediction.status} size="sm" />
                    </div>

                    <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs">
                      <p className="font-bold text-fg">
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
                      <p className="font-medium text-fg-muted">
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
      </Card>
    </section>
  );
}
