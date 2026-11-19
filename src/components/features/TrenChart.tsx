"use client";

import { useEffect, useState } from "react";
import type { Jalur } from "@/config/app.config";
import { copy } from "@/config/copy";
import {
  fetchPtnDetail,
  type HistorisTahun,
  type ProdiDetail,
  type ProdiIndexItem,
} from "@/lib/dataset";
import { Button, Card, Skeleton } from "@/components/ui";

export interface TrenTargetItem {
  slot: 1 | 2;
  prodi: ProdiIndexItem;
}

export interface TrenChartProps {
  jalur: Jalur;
  items: readonly TrenTargetItem[];
}

interface SingleTrenProps {
  jalur: Jalur;
  item: TrenTargetItem;
}

function BarChartSvg({ historis }: { historis: readonly HistorisTahun[] }) {
  const maxVal = Math.max(
    1,
    ...historis.flatMap((h) => [h.peminat, h.daya_tampung])
  );

  const chartWidth = 320;
  const chartHeight = 160;
  const padTop = 24;
  const padBottom = 26;
  const padX = 16;
  const plotHeight = chartHeight - padTop - padBottom;
  const groupWidth = (chartWidth - padX * 2) / historis.length;
  const barWidth = Math.min(28, groupWidth * 0.3);
  const barGap = 6;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label={copy.tren.title}
        className="h-auto w-full"
      >
        {/* Garis dasar */}
        <line
          x1={padX}
          y1={padTop + plotHeight}
          x2={chartWidth - padX}
          y2={padTop + plotHeight}
          stroke="var(--color-line-strong)"
          strokeWidth={1}
        />

        {historis.map((row, idx) => {
          const groupCenter = padX + groupWidth * idx + groupWidth / 2;
          const peminatHeight = Math.max(
            2,
            (row.peminat / maxVal) * plotHeight
          );
          const kuotaHeight = Math.max(
            2,
            (row.daya_tampung / maxVal) * plotHeight
          );

          const peminatX = groupCenter - barWidth - barGap / 2;
          const kuotaX = groupCenter + barGap / 2;
          const peminatY = padTop + plotHeight - peminatHeight;
          const kuotaY = padTop + plotHeight - kuotaHeight;

          return (
            <g key={row.tahun}>
              {/* Batang Peminat */}
              <rect
                x={peminatX}
                y={peminatY}
                width={barWidth}
                height={peminatHeight}
                rx={4}
                fill="var(--color-brand)"
              />
              <text
                x={peminatX + barWidth / 2}
                y={peminatY - 5}
                textAnchor="middle"
                fontSize={10}
                fill="var(--color-fg-muted)"
              >
                {row.peminat}
              </text>

              {/* Batang Daya Tampung */}
              <rect
                x={kuotaX}
                y={kuotaY}
                width={barWidth}
                height={kuotaHeight}
                rx={4}
                fill="var(--color-status-safe)"
              />
              <text
                x={kuotaX + barWidth / 2}
                y={kuotaY - 5}
                textAnchor="middle"
                fontSize={10}
                fill="var(--color-fg-muted)"
              >
                {row.daya_tampung}
              </text>

              {/* Label Tahun */}
              <text
                x={groupCenter}
                y={chartHeight - 8}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fill="var(--color-fg)"
              >
                {row.tahun}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legenda memakai token CSS */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block size-3 rounded-xs bg-brand"
          />
          {copy.tren.peminat}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block size-3 rounded-xs bg-status-safe"
          />
          {copy.tren.dayaTampung}
        </span>
      </div>
    </div>
  );
}

function SingleProdiTren({ jalur, item }: SingleTrenProps) {
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

  return (
    <Card
      as="article"
      title={
        <span className="flex flex-wrap items-center gap-2">
          <span className="rounded-control bg-surface-muted px-2 py-0.5 text-xs font-semibold text-fg-muted">
            {copy.hasil.pilihanBadge(item.slot)}
          </span>
          <span>
            {item.prodi.nama} ({item.prodi.jenjang})
          </span>
        </span>
      }
      description={item.prodi.nama_ptn}
    >
      {loading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-36 w-full" rounded="control" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      ) : error ? (
        <div className="space-y-3">
          <p className="text-sm text-danger">{error}</p>
          <Button
            variant="secondary"
            onClick={() => setRetryCount((c) => c + 1)}
          >
            {copy.error.retry}
          </Button>
        </div>
      ) : historis.length === 0 ? (
        <p className="text-sm text-fg-muted">{copy.tren.empty}</p>
      ) : (
        <div className="space-y-4">
          <BarChartSvg historis={historis} />

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">{copy.tren.tableCaption}</caption>
              <thead>
                <tr className="border-b border-line text-xs text-fg-muted">
                  <th scope="col" className="py-2 pr-3 font-medium">
                    {copy.tren.tahun}
                  </th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">
                    {copy.tren.dayaTampung}
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    {copy.tren.peminat}
                  </th>
                </tr>
              </thead>
              <tbody>
                {historis.map((row) => (
                  <tr key={row.tahun} className="border-b border-line last:border-0">
                    <td className="py-2 pr-3 font-medium text-fg">
                      {row.tahun}
                    </td>
                    <td className="py-2 pr-3 text-right text-fg">
                      {row.daya_tampung.toLocaleString("id-ID")}
                    </td>
                    <td className="py-2 text-right text-fg">
                      {row.peminat.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {jalurData && jalurData.tersedia && (
            <p className="text-xs text-fg-muted">
              {copy.tren.rasio}:{" "}
              <strong className="text-fg">
                {jalurData.rasio_diterima_persen}%
              </strong>
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

export function TrenChart({ jalur, items }: TrenChartProps) {
  return (
    <section aria-label={copy.tren.title} className="space-y-4">
      <h2 className="text-lg font-bold text-fg">{copy.tren.title}</h2>
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <SingleProdiTren
            key={`${item.slot}-${item.prodi.kode_prodi}`}
            jalur={jalur}
            item={item}
          />
        ))}
      </div>
    </section>
  );
}
