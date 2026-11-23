"use client";

import { useEffect, useId, useState } from "react";
import type { Jalur } from "@/config/app.config";
import { copy } from "@/config/copy";
import {
  fetchPtnDetail,
  type HistorisTahun,
  type ProdiDetail,
  type ProdiIndexItem,
} from "@/lib/dataset";
import { Button, Card, Skeleton, cn } from "@/components/ui";

export interface TrenTargetItem {
  slot: 1 | 2;
  prodi: ProdiIndexItem;
}

export interface TrenChartProps {
  jalur: Jalur;
  items: readonly TrenTargetItem[];
  /** Jika true, tidak merender judul section luar (dipakai di dalam tab). */
  embedded?: boolean;
}

interface SingleTrenProps {
  jalur: Jalur;
  item: TrenTargetItem;
  embedded: boolean;
}

function formatBarValue(value: number): string {
  return value.toLocaleString("id-ID");
}

function BarChartSvg({
  historis,
  prodiName,
}: {
  historis: readonly HistorisTahun[];
  prodiName: string;
}) {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descId = `${baseId}-desc`;

  const maxVal = Math.max(
    1,
    ...historis.flatMap((h) => [h.peminat, h.daya_tampung])
  );

  const chartWidth = 340;
  const chartHeight = 192;
  const padTop = 32;
  const padBottom = 28;
  const padX = 18;
  const plotHeight = chartHeight - padTop - padBottom;
  const baselineY = padTop + plotHeight;
  const groupWidth = (chartWidth - padX * 2) / historis.length;
  const barGap = Math.min(12, Math.max(8, groupWidth * 0.12));
  const barWidth = Math.min(34, Math.max(18, (groupWidth - barGap - 18) / 2));

  const descText = historis
    .map(
      (row) =>
        `${row.tahun}: ${copy.tren.peminat} ${formatBarValue(row.peminat)}, ${copy.tren.dayaTampung} ${formatBarValue(row.daya_tampung)}`
    )
    .join("; ");

  return (
    <div className="space-y-2.5">
      <div className="w-full overflow-hidden rounded-lg border-2 border-line bg-surface p-2.5 sm:p-3">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          role="img"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className="block h-auto w-full"
        >
          <title id={titleId}>
            {copy.tren.title} — {prodiName}
          </title>
          <desc id={descId}>{descText}</desc>

          {/* Garis bantu horizontal tipis */}
          <line
            x1={padX}
            y1={padTop}
            x2={chartWidth - padX}
            y2={padTop}
            stroke="var(--color-line-soft)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <line
            x1={padX}
            y1={padTop + plotHeight / 2}
            x2={chartWidth - padX}
            y2={padTop + plotHeight / 2}
            stroke="var(--color-line-soft)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />

          {/* Garis dasar */}
          <line
            x1={padX}
            y1={baselineY}
            x2={chartWidth - padX}
            y2={baselineY}
            stroke="var(--color-line-strong)"
            strokeWidth={2}
          />

          {historis.map((row, idx) => {
            const groupCenter = padX + groupWidth * idx + groupWidth / 2;
            const peminatHeight =
              row.peminat > 0
                ? Math.max(6, (row.peminat / maxVal) * plotHeight)
                : 0;
            const kuotaHeight =
              row.daya_tampung > 0
                ? Math.max(6, (row.daya_tampung / maxVal) * plotHeight)
                : 0;

            const peminatX = groupCenter - barWidth - barGap / 2;
            const kuotaX = groupCenter + barGap / 2;
            const peminatY = baselineY - peminatHeight;
            const kuotaY = baselineY - kuotaHeight;

            const peminatLabel = formatBarValue(row.peminat);
            const kuotaLabel = formatBarValue(row.daya_tampung);
            const peminatCenterX = peminatX + barWidth / 2;
            const kuotaCenterX = kuotaX + barWidth / 2;
            const centerDist = kuotaCenterX - peminatCenterX;

            // Cegah tumpang tindih label nilai saat angka besar & tinggi batang berdekatan
            let peminatLabelY = peminatY - 6;
            let kuotaLabelY = kuotaY - 6;
            const minClearance =
              (peminatLabel.length * 6.8) / 2 +
              (kuotaLabel.length * 6.8) / 2 +
              6;
            if (
              centerDist < minClearance &&
              Math.abs(peminatLabelY - kuotaLabelY) < 14
            ) {
              if (peminatLabelY <= kuotaLabelY) {
                peminatLabelY = Math.max(12, kuotaLabelY - 14);
              } else {
                kuotaLabelY = Math.max(12, peminatLabelY - 14);
              }
            }

            return (
              <g key={row.tahun}>
                {/* Batang Peminat */}
                {peminatHeight > 0 && (
                  <rect
                    x={peminatX}
                    y={peminatY}
                    width={barWidth}
                    height={peminatHeight}
                    rx={4}
                    fill="var(--color-brand)"
                    stroke="var(--color-line)"
                    strokeWidth={1.5}
                  />
                )}
                <text
                  x={peminatCenterX}
                  y={peminatLabelY}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill="var(--color-fg)"
                >
                  {peminatLabel}
                </text>

                {/* Batang Daya Tampung */}
                {kuotaHeight > 0 && (
                  <rect
                    x={kuotaX}
                    y={kuotaY}
                    width={barWidth}
                    height={kuotaHeight}
                    rx={4}
                    fill="var(--color-status-safe-soft)"
                    stroke="var(--color-line)"
                    strokeWidth={1.5}
                  />
                )}
                <text
                  x={kuotaCenterX}
                  y={kuotaLabelY}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill="var(--color-fg)"
                >
                  {kuotaLabel}
                </text>

                {/* Label Tahun */}
                <text
                  x={groupCenter}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={700}
                  fill="var(--color-fg)"
                >
                  {row.tahun}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legenda memakai token CSS */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs font-bold text-fg">
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block size-3.5 rounded-xs border-2 border-line bg-brand"
          />
          {copy.tren.peminat}
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block size-3.5 rounded-xs border-2 border-line bg-status-safe-soft"
          />
          {copy.tren.dayaTampung}
        </span>
      </div>
    </div>
  );
}

function SingleProdiTren({ jalur, item, embedded }: SingleTrenProps) {
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${item.prodi.id_ptn}:${item.prodi.kode_prodi}:${retryCount}`;
  const [fetchState, setFetchState] = useState<{
    key: string;
    detail: ProdiDetail | null;
    error: string | null;
  }>({
    key: "",
    detail: null,
    error: null,
  });

  useEffect(() => {
    let active = true;

    fetchPtnDetail(item.prodi.id_ptn)
      .then((ptn) => {
        if (!active) return;
        const found =
          ptn.prodi_list.find((p) => p.kode_prodi === item.prodi.kode_prodi) ??
          null;
        setFetchState({ key: requestKey, detail: found, error: null });
      })
      .catch(() => {
        if (!active) return;
        setFetchState({
          key: requestKey,
          detail: null,
          error: copy.error.datasetLoad,
        });
      });

    return () => {
      active = false;
    };
  }, [item.prodi.id_ptn, item.prodi.kode_prodi, requestKey]);

  const loading = fetchState.key !== requestKey;
  const detail = loading ? null : fetchState.detail;
  const error = loading ? null : fetchState.error;

  const jalurData = detail ? detail[jalur] : null;
  const historis =
    jalurData && jalurData.tersedia ? jalurData.historis : [];

  const prodiTitle = `${item.prodi.nama} (${item.prodi.jenjang})`;

  const content = loading ? (
    <div className="space-y-3" role="status" aria-busy="true">
      <Skeleton className="h-44 w-full" rounded="control" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-full" />
    </div>
  ) : error ? (
    <div className="space-y-3">
      <p role="alert" className="text-sm font-medium text-danger">
        {error}
      </p>
      <Button
        variant="secondary"
        onClick={() => setRetryCount((c) => c + 1)}
      >
        {copy.error.retry}
      </Button>
    </div>
  ) : historis.length === 0 ? (
    <p className="text-sm font-medium text-fg-muted">{copy.tren.empty}</p>
  ) : (
    <div className="space-y-4">
      <BarChartSvg historis={historis} prodiName={prodiTitle} />

      <div className="overflow-x-auto rounded-lg border-2 border-line bg-surface">
        <table className="w-full border-collapse text-left text-xs">
          <caption className="sr-only">
            {copy.tren.tableCaption} — {prodiTitle}
          </caption>
          <thead>
            <tr className="border-b-2 border-line bg-surface-muted text-xs text-fg">
              <th scope="col" className="px-3 py-2 font-display font-bold">
                {copy.tren.tahun}
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-right font-display font-bold"
              >
                {copy.tren.dayaTampung}
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-right font-display font-bold"
              >
                {copy.tren.peminat}
              </th>
            </tr>
          </thead>
          <tbody>
            {historis.map((row) => (
              <tr
                key={row.tahun}
                className="border-b border-line-soft last:border-0"
              >
                <th
                  scope="row"
                  className="px-3 py-2 font-display font-bold text-fg tabular-nums"
                >
                  {row.tahun}
                </th>
                <td className="px-3 py-2 text-right font-semibold text-fg tabular-nums">
                  {row.daya_tampung.toLocaleString("id-ID")}
                </td>
                <td className="px-3 py-2 text-right font-semibold text-fg tabular-nums">
                  {row.peminat.toLocaleString("id-ID")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {jalurData && jalurData.tersedia && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border-2 border-line bg-surface px-3 py-2 text-xs">
          <span className="font-semibold text-fg-muted">{copy.tren.rasio}</span>
          <strong className="font-display text-sm font-bold text-fg tabular-nums">
            {jalurData.rasio_diterima_persen.toLocaleString("id-ID", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
            %
          </strong>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <article className="flex min-w-0 flex-col justify-between gap-4 rounded-control border-2 border-line bg-surface-warm p-3.5 sm:p-4">
        <div className="space-y-1">
          <span className="inline-block rounded-md border-2 border-line bg-surface px-2 py-0.5 font-display text-[11px] font-bold tracking-wider text-fg-muted">
            {copy.hasil.pilihanBadge(item.slot)}
          </span>
          <h3 className="break-words font-display text-base leading-snug font-bold tracking-tight text-fg">
            {prodiTitle}
          </h3>
          <p className="break-words text-xs font-medium text-fg-muted">
            {item.prodi.nama_ptn}
          </p>
        </div>
        {content}
      </article>
    );
  }

  return (
    <Card
      as="article"
      titleAs="h3"
      title={
        <span className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border-2 border-line bg-surface-muted px-2 py-0.5 font-display text-xs font-bold text-fg-muted">
            {copy.hasil.pilihanBadge(item.slot)}
          </span>
          <span className="break-words">{prodiTitle}</span>
        </span>
      }
      description={item.prodi.nama_ptn}
    >
      {content}
    </Card>
  );
}

export function TrenChart({ jalur, items, embedded = false }: TrenChartProps) {
  return (
    <section aria-label={copy.tren.title} className="space-y-3">
      {!embedded && (
        <h2 className="font-display text-lg font-bold text-fg">
          {copy.tren.title}
        </h2>
      )}
      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          items.length > 1 && "md:grid-cols-2"
        )}
      >
        {items.map((item) => (
          <SingleProdiTren
            key={`${item.slot}-${item.prodi.kode_prodi}`}
            jalur={jalur}
            item={item}
            embedded={embedded}
          />
        ))}
      </div>
    </section>
  );
}
