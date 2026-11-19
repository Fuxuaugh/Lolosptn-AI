"use client";

import type { Jalur } from "@/config/app.config";
import { copy } from "@/config/copy";
import type { ProdiDetail, ProdiIndexItem } from "@/lib/dataset";
import type { PredictionResult } from "@/lib/prediction";
import { Badge, Card, Skeleton } from "@/components/ui";

export interface HasilPilihanItem {
  slot: 1 | 2;
  prodi: ProdiIndexItem;
  detail: ProdiDetail | null;
  detailLoading: boolean;
  prediction: PredictionResult;
}

export interface HasilKartuProps {
  jalur: Jalur;
  items: readonly HasilPilihanItem[];
}

function formatPercent(value: number): string {
  return String(Math.round(value));
}

function formatSignedDelta(value: number): string {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value}`;
}

export function HasilKartu({ jalur, items }: HasilKartuProps) {
  const userScoreLabel =
    jalur === "snbt" ? copy.hasil.skorKamu : copy.hasil.raporKamu;
  const refScoreLabel =
    jalur === "snbt" ? copy.hasil.skorAcuan : copy.hasil.raporAcuan;

  return (
    <section aria-label={copy.hasil.title} className="space-y-4">
      <h2 className="text-lg font-bold text-fg">{copy.hasil.title}</h2>

      <div className="flex flex-col gap-4">
        {items.map(({ slot, prodi, detail, detailLoading, prediction }) => {
          const jalurDetail = detail ? detail[jalur] : null;
          const kuotaTerbaru =
            jalurDetail && jalurDetail.tersedia
              ? jalurDetail.kuota_terbaru
              : null;

          return (
            <Card
              key={`${slot}-${prodi.kode_prodi}`}
              as="article"
              title={
                <span className="flex flex-wrap items-center gap-2">
                  <span className="rounded-control bg-surface-muted px-2 py-0.5 text-xs font-semibold text-fg-muted">
                    {copy.hasil.pilihanBadge(slot)}
                  </span>
                  <span>
                    {prodi.nama} ({prodi.jenjang})
                  </span>
                </span>
              }
              description={prodi.nama_ptn}
              actions={<Badge status={prediction.status} showEnglish />}
            >
              <div className="space-y-4">
                {/* Probabilitas utama + rentang sensitivitas */}
                <div className="rounded-control bg-surface-muted p-4">
                  <p className="text-xs font-medium text-fg-muted">
                    {copy.hasil.peluangLabel}
                  </p>
                  <p className="mt-1 text-4xl font-bold tracking-tight text-fg">
                    {copy.hasil.peluang(formatPercent(prediction.probability))}
                  </p>
                  <p className="mt-1 text-sm font-medium text-fg">
                    {copy.hasil.rentangSensitivitas(
                      formatPercent(prediction.pLow),
                      formatPercent(prediction.pHigh)
                    )}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">
                    {copy.hasil.rentangSensitivitasNote}
                  </p>
                  {prediction.isUncertain && (
                    <p className="mt-1.5 text-xs font-medium text-callout-fg">
                      {copy.hasil.uncertainNote}
                    </p>
                  )}
                </div>

                {/* Ringkasan angka skor & info prodi */}
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-control border border-line p-3">
                    <dt className="text-xs text-fg-muted">{userScoreLabel}</dt>
                    <dd className="mt-0.5 font-semibold text-fg">
                      {prediction.userScore}
                    </dd>
                  </div>
                  <div className="rounded-control border border-line p-3">
                    <dt className="text-xs text-fg-muted">{refScoreLabel}</dt>
                    <dd className="mt-0.5 font-semibold text-fg">
                      {prediction.referenceScore}{" "}
                      <span className="text-xs font-normal text-fg-muted">
                        ({copy.hasil.selisih}{" "}
                        {formatSignedDelta(prediction.delta)})
                      </span>
                    </dd>
                  </div>
                  <div className="rounded-control border border-line p-3">
                    <dt className="text-xs text-fg-muted">
                      {copy.hasil.kuotaTerbaru}
                    </dt>
                    <dd className="mt-0.5 font-semibold text-fg">
                      {detailLoading ? (
                        <Skeleton className="mt-1 h-4 w-16" />
                      ) : kuotaTerbaru !== null ? (
                        kuotaTerbaru.toLocaleString("id-ID")
                      ) : (
                        copy.hasil.kuotaUnavailable
                      )}
                    </dd>
                  </div>
                  <div className="rounded-control border border-line p-3">
                    <dt className="text-xs text-fg-muted">
                      {copy.hasil.portofolio}
                    </dt>
                    <dd className="mt-0.5 font-semibold text-fg">
                      {detailLoading ? (
                        <Skeleton className="mt-1 h-4 w-24" />
                      ) : (
                        detail?.nama_portofolio ?? copy.hasil.kuotaUnavailable
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
