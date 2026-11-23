"use client";

import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { APP_CONFIG, type Jalur, type StatusKategori } from "@/config/app.config";
import { copy } from "@/config/copy";
import type { ProdiDetail, ProdiIndexItem } from "@/lib/dataset";
import {
  calculateRequiredScore,
  type PredictionResult,
} from "@/lib/prediction";
import { Badge, Card, Skeleton, cn } from "@/components/ui";

const EASE_SNAPPY = [0.22, 1, 0.36, 1] as const;

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
  /** Berubah tiap kali pengguna menekan Hitung agar animasi count-up & bar mengulang. */
  animationKey?: number;
}

const BAR_FILL: Record<StatusKategori, string> = {
  safe: "bg-status-safe-soft",
  target: "bg-status-target-soft",
  reach: "bg-status-reach-soft",
};

function formatPercent(value: number): string {
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatScore(value: number, fractionDigits?: number): string {
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: fractionDigits ?? 0,
    maximumFractionDigits: fractionDigits ?? 2,
  });
}

function formatRoundedPercent(value: number): string {
  return String(Math.round(value));
}

function formatSignedDelta(value: number): string {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatScore(value)}`;
}

function AnimatedPercent({
  value,
  animationKey,
}: {
  value: number;
  animationKey: number;
}) {
  const prefersReduced = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(
    prefersReduced ? value : 0
  );

  useEffect(() => {
    if (prefersReduced) {
      return;
    }

    const controls = animate(0, value, {
      duration: 0.7,
      ease: EASE_SNAPPY,
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest * 100) / 100);
      },
      onComplete: () => {
        setDisplayValue(value);
      },
    });

    return () => controls.stop();
  }, [value, animationKey, prefersReduced]);

  const shown = prefersReduced ? value : displayValue;
  return <>{copy.hasil.peluang(formatPercent(shown))}</>;
}

export function HasilKartu({
  jalur,
  items,
  animationKey = 0,
}: HasilKartuProps) {
  const prefersReduced = useReducedMotion();
  const userScoreLabel =
    jalur === "snbt" ? copy.hasil.skorKamu : copy.hasil.raporKamu;
  const refScoreLabel =
    jalur === "snbt" ? copy.hasil.skorAcuan : copy.hasil.raporAcuan;
  const jalurUpper = jalur.toUpperCase();
  const allSameUserScore =
    items.length > 0 &&
    items.every(
      (item) => item.prediction.userScore === items[0].prediction.userScore
    );
  const headerScore = allSameUserScore
    ? items[0]?.prediction.userScore
    : undefined;

  return (
    <motion.div
      key={`hasil-wrap-${animationKey}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE_SNAPPY }}
    >
      <Card
        as="section"
        aria-label={copy.hasil.title}
        titleAs="h2"
        title={
          <span className="text-base tabular-nums sm:text-lg">
            {copy.hasil.title} • {jalurUpper}
            {headerScore !== undefined ? ` (${formatScore(headerScore)})` : ""}
          </span>
        }
        actions={
          <span className="inline-block rounded-lg border-2 border-line bg-accent-yellow px-2.5 py-1 font-display text-[11px] font-bold text-accent-yellow-fg shadow-pill">
            {copy.hasil.shareableTag}
          </span>
        }
      >
        <div className="space-y-4">
          <div
            className={cn(
              "grid grid-cols-1 gap-4",
              items.length > 1 && "sm:grid-cols-2"
            )}
          >
            {items.map(
              ({ slot, prodi, detail, detailLoading, prediction }, idx) => {
                const jalurDetail = detail ? detail[jalur] : null;
                const kuotaTerbaru =
                  jalurDetail && jalurDetail.tersedia
                    ? jalurDetail.kuota_terbaru
                    : null;
                const fillPct = Math.max(
                  4,
                  Math.min(100, prediction.probability)
                );
                const acuanDibatasi =
                  jalur === "snbt" && prodi.snbt.tersedia
                    ? prodi.snbt.acuan_dibatasi ?? null
                    : jalur === "snbp" && prodi.snbp.tersedia
                      ? prodi.snbp.acuan_dibatasi ?? null
                      : null;
                const safeTarget =
                  jalur === "snbt"
                    ? calculateRequiredScore({
                        jalur: "snbt",
                        referenceScore: prediction.referenceScore,
                        userScore: prediction.userScore,
                        targetProbability: APP_CONFIG.statusThresholds.safe,
                        acuanDibatasi,
                      })
                    : null;

                return (
                  <article
                    key={`${slot}-${prodi.kode_prodi}`}
                    className="flex min-w-0 flex-col justify-between gap-3.5 rounded-control border-2 border-line bg-surface-warm p-4"
                  >
                    <div className="space-y-2.5">
                      {/* Top Bar: Slot & Status Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-display text-xs font-bold tracking-wider text-fg-muted">
                          {copy.hasil.pilihanBadge(slot)}
                        </span>
                        <Badge status={prediction.status} size="sm" />
                      </div>

                      {/* Nama Prodi & PTN */}
                      <div className="min-w-0">
                        <h3 className="break-words text-base leading-snug font-bold text-fg">
                          {prodi.nama} ({prodi.jenjang})
                        </h3>
                        <p className="mt-0.5 break-words text-xs font-medium text-fg-muted">
                          {prodi.nama_ptn}
                        </p>
                      </div>

                      {/* Angka Probabilitas Besar (count-up) + Progress Bar 2px */}
                      <div className="space-y-2 pt-1">
                        <p className="font-display text-4xl leading-none font-bold tracking-tight text-fg tabular-nums">
                          <AnimatedPercent
                            value={prediction.probability}
                            animationKey={animationKey}
                          />
                        </p>

                        <div
                          role="progressbar"
                          aria-label={`${copy.hasil.peluangLabel} — ${prodi.nama}`}
                          aria-valuenow={Math.round(prediction.probability)}
                          aria-valuetext={copy.hasil.peluang(
                            formatPercent(prediction.probability)
                          )}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          className="h-3.5 w-full overflow-hidden rounded-full border-2 border-line bg-surface"
                        >
                          <motion.div
                            key={`bar-${animationKey}-${slot}-${prodi.kode_prodi}-${prediction.probability}`}
                            initial={prefersReduced ? false : { width: "0%" }}
                            animate={{ width: `${fillPct}%` }}
                            transition={{
                              duration: 0.72,
                              delay: idx * 0.08,
                              ease: EASE_SNAPPY,
                            }}
                            className={cn(
                              "h-full",
                              fillPct < 99 && "border-r-2 border-line",
                              BAR_FILL[prediction.status]
                            )}
                          />
                        </div>

                        <p className="text-xs font-semibold text-fg tabular-nums">
                          {copy.hasil.rentangSensitivitas(
                            formatRoundedPercent(prediction.pLow),
                            formatRoundedPercent(prediction.pHigh)
                          )}
                        </p>
                        <p className="text-xs leading-relaxed text-fg-muted">
                          {copy.hasil.rentangSensitivitasNote}
                        </p>
                        {prediction.isUncertain && (
                          <p className="rounded-lg border-2 border-line bg-callout-bg px-2.5 py-1.5 text-xs leading-relaxed font-semibold text-callout-fg">
                            {copy.hasil.uncertainNote}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Meta Grid + Target 75% SNBT */}
                    <div className="space-y-3 border-t-2 border-line-soft pt-3">
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
                        <div className="min-w-0">
                          <dt className="text-[11px] font-medium text-fg-muted">
                            {userScoreLabel}
                          </dt>
                          <dd className="font-display text-sm font-bold text-fg tabular-nums">
                            {formatScore(prediction.userScore)}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[11px] font-medium text-fg-muted">
                            {refScoreLabel}
                          </dt>
                          <dd className="font-display text-sm font-bold text-fg tabular-nums">
                            {formatScore(prediction.referenceScore)}{" "}
                            <span className="font-sans text-xs font-semibold text-fg-muted">
                              ({formatSignedDelta(prediction.delta)})
                            </span>
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[11px] font-medium text-fg-muted">
                            {copy.hasil.kuotaTerbaru}
                          </dt>
                          <dd className="font-bold text-fg tabular-nums">
                            {detailLoading ? (
                              <Skeleton className="mt-1 h-3.5 w-14" />
                            ) : kuotaTerbaru !== null ? (
                              kuotaTerbaru.toLocaleString("id-ID")
                            ) : (
                              copy.hasil.kuotaUnavailable
                            )}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[11px] font-medium text-fg-muted">
                            {copy.hasil.portofolio}
                          </dt>
                          <dd className="break-words leading-snug font-bold text-fg">
                            {detailLoading ? (
                              <Skeleton className="mt-1 h-3.5 w-20" />
                            ) : (
                              detail?.nama_portofolio ??
                              copy.hasil.kuotaUnavailable
                            )}
                          </dd>
                        </div>
                      </dl>

                      {safeTarget && (
                        <div className="space-y-1 rounded-lg border-2 border-line bg-surface p-2.5 text-xs">
                          <p className="text-[11px] font-bold tracking-wide text-fg-muted uppercase">
                            {copy.hasil.targetSafeLabel}
                          </p>
                          <p
                            className={cn(
                              "font-display text-sm font-bold tabular-nums",
                              safeTarget.isOutOfScale
                                ? "text-status-reach-fg"
                                : safeTarget.gap === 0
                                  ? "text-status-safe-fg"
                                  : "text-fg"
                            )}
                          >
                            {safeTarget.isOutOfScale
                              ? copy.hasil.targetSafeOutOfScale
                              : safeTarget.gap === 0
                                ? copy.hasil.targetSafeAlready(
                                    formatScore(safeTarget.requiredScore, 1)
                                  )
                                : copy.hasil.targetSafeGap(
                                    formatScore(safeTarget.requiredScore, 1),
                                    formatScore(safeTarget.gap, 1)
                                  )}
                          </p>
                          {safeTarget.acuanDibatasi === "atas" && (
                            <p className="text-xs leading-relaxed text-fg-muted">
                              {copy.hasil.acuanClampedHigh(
                                APP_CONFIG.acuanClamp.snbt.max
                              )}
                            </p>
                          )}
                          {safeTarget.acuanDibatasi === "bawah" && (
                            <p className="text-xs leading-relaxed text-fg-muted">
                              {copy.hasil.acuanClampedLow(
                                APP_CONFIG.acuanClamp.snbt.min
                              )}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </div>

          {/* Legenda 3 Status Warna & Sumber Data */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-t-2 border-line-soft pt-3">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="rounded-full border-2 border-line bg-status-safe-soft px-2.5 py-0.5 text-xs font-bold text-status-safe-fg">
                {copy.hasil.legend.safe}
              </span>
              <span className="rounded-full border-2 border-line bg-status-target-soft px-2.5 py-0.5 text-xs font-bold text-status-target-fg">
                {copy.hasil.legend.target}
              </span>
              <span className="rounded-full border-2 border-line bg-status-reach-soft px-2.5 py-0.5 text-xs font-bold text-status-reach-fg">
                {copy.hasil.legend.reach}
              </span>
            </div>
            <p className="text-xs font-medium text-fg-muted">
              {(() => {
                const years = items
                  .flatMap((it) => {
                    const jd = it.detail?.[jalur];
                    return jd && jd.tersedia
                      ? jd.historis.map((h) => h.tahun)
                      : [];
                  })
                  .sort((a, b) => a - b);
                if (years.length === 0) return copy.hasil.dataSource;
                const first = years[0];
                const last = years[years.length - 1];
                return copy.hasil.dataSourceWithYears(
                  first === last ? String(first) : `${first}–${last}`
                );
              })()}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
