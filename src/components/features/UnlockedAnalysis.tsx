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
      className="flex flex-col gap-4"
    >
      <h2 className="text-lg font-bold text-fg">
        {copy.paywall.unlockedTitle}
      </h2>

      {/* Pengingat screenshot wajib (PRD Bagian 5 F4) */}
      <Callout tone="warning" title={copy.paywall.screenshotReminderTitle}>
        <p>{copy.paywall.screenshotReminder}</p>
      </Callout>

      {/* F5: Smart Alternative Recommender */}
      <Card
        title={copy.paywall.alternativesTitle}
        description={copy.paywall.alternativesSubtitle}
      >
        {data.alternatives.length === 0 ? (
          <p className="text-sm text-fg-muted">
            {copy.fallback.noAlternatives}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.alternatives.map(({ prodi, prediction }) => (
              <li
                key={prodi.kode_prodi}
                className="rounded-control border border-line bg-surface-muted p-3.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-fg">
                      {prodi.nama} ({prodi.jenjang})
                    </p>
                    <p className="text-xs text-fg-muted">{prodi.nama_ptn}</p>
                  </div>
                  <Badge status={prediction.status} size="sm" showEnglish />
                </div>

                <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs">
                  <p className="font-semibold text-fg">
                    {copy.hasil.peluangLabel}:{" "}
                    <span className="text-sm">
                      {copy.hasil.peluang(
                        formatPercent(prediction.probability)
                      )}
                    </span>{" "}
                    <span className="font-normal text-fg-muted">
                      (
                      {copy.hasil.rentangSensitivitas(
                        formatPercent(prediction.pLow),
                        formatPercent(prediction.pHigh)
                      )}
                      )
                    </span>
                  </p>
                  <p className="text-fg-muted">
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
      </Card>

      {/* F6: AI Strategy Advisor (atau fallback template) */}
      <Card
        title={copy.paywall.aiTitle}
        description={copy.paywall.aiSubtitle}
      >
        <div className="space-y-3">
          {data.isFallback && (
            <Callout tone="info" title={copy.fallback.aiUnavailable}>
              <p>{copy.fallback.aiUnavailableBody}</p>
            </Callout>
          )}

          {data.cached && !data.isFallback && (
            <p className="text-xs text-fg-muted">{copy.paywall.cachedBadge}</p>
          )}

          <div className="space-y-3 text-sm leading-relaxed text-fg">
            {paragraphs.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}
