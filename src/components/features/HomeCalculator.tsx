"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { Jalur } from "@/config/app.config";
import { copy } from "@/config/copy";
import { THEME, type ResultSection } from "@/config/theme";
import {
  fetchPtnDetail,
  type ProdiDetail,
  type ProdiIndexItem,
} from "@/lib/dataset";
import {
  predictSnbp,
  predictSnbt,
  toSnbpTarget,
  toSnbtTarget,
  type PredictionResult,
} from "@/lib/prediction";
import { Button, Callout } from "@/components/ui";
import { HasilKartu, type HasilPilihanItem } from "./HasilKartu";
import { MetodologiModal } from "./MetodologiModal";
import { PaywallPreview } from "./PaywallPreview";
import {
  PredictionForm,
  type PredictionFormPayload,
} from "./PredictionForm";
import { TrenChart, type TrenTargetItem } from "./TrenChart";

interface ComputedEntry {
  slot: 1 | 2;
  prodi: ProdiIndexItem;
  prediction: PredictionResult;
}

interface CalculationState {
  jalur: Jalur;
  entries: ComputedEntry[];
}

export function HomeCalculator() {
  const [result, setResult] = useState<CalculationState | null>(null);
  const [detailsByKode, setDetailsByKode] = useState<
    Record<string, ProdiDetail | null>
  >({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [metodologiOpen, setMetodologiOpen] = useState(false);

  const resultSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!result) return;

    let active = true;
    const uniquePtnIds = Array.from(
      new Set(result.entries.map((entry) => entry.prodi.id_ptn))
    );

    Promise.all(
      uniquePtnIds.map((idPtn) => fetchPtnDetail(idPtn).catch(() => null))
    ).then((ptnDetails) => {
      if (!active) return;

      const nextMap: Record<string, ProdiDetail | null> = {};
      for (const entry of result.entries) {
        const ptn = ptnDetails.find((p) => p?.id_ptn === entry.prodi.id_ptn);
        nextMap[entry.prodi.kode_prodi] =
          ptn?.prodi_list.find(
            (p) => p.kode_prodi === entry.prodi.kode_prodi
          ) ?? null;
      }

      setDetailsByKode(nextMap);
      setDetailsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [result]);

  function handleSubmit(payload: PredictionFormPayload) {
    const entries: ComputedEntry[] = [];

    if (payload.jalur === "snbt") {
      const target1 = toSnbtTarget(payload.pilihan1);
      if (target1) {
        entries.push({
          slot: 1,
          prodi: payload.pilihan1,
          prediction: predictSnbt(payload.snbtInput, target1),
        });
      }
      if (payload.pilihan2) {
        const target2 = toSnbtTarget(payload.pilihan2);
        if (target2) {
          entries.push({
            slot: 2,
            prodi: payload.pilihan2,
            prediction: predictSnbt(payload.snbtInput, target2),
          });
        }
      }
    } else {
      const target1 = toSnbpTarget(payload.pilihan1);
      if (target1) {
        entries.push({
          slot: 1,
          prodi: payload.pilihan1,
          prediction: predictSnbp(
            { ...payload.snbpProfile, hasAlumni: payload.pilihan1HasAlumni },
            target1
          ),
        });
      }
      if (payload.pilihan2) {
        const target2 = toSnbpTarget(payload.pilihan2);
        if (target2) {
          entries.push({
            slot: 2,
            prodi: payload.pilihan2,
            prediction: predictSnbp(
              { ...payload.snbpProfile, hasAlumni: payload.pilihan2HasAlumni },
              target2
            ),
          });
        }
      }
    }

    if (entries.length === 0) return;

    setDetailsLoading(true);
    setResult({ jalur: payload.jalur, entries });

    requestAnimationFrame(() => {
      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      resultSectionRef.current?.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  function handleReset() {
    setResult(null);
    setDetailsByKode({});
    setDetailsLoading(false);
  }

  function renderResultSection(section: ResultSection) {
    if (!result) return null;

    if (section === "hasil") {
      const hasilItems: HasilPilihanItem[] = result.entries.map((entry) => ({
        slot: entry.slot,
        prodi: entry.prodi,
        detail: detailsByKode[entry.prodi.kode_prodi] ?? null,
        detailLoading: detailsLoading,
        prediction: entry.prediction,
      }));
      return <HasilKartu jalur={result.jalur} items={hasilItems} />;
    }

    if (section === "tren") {
      const trenItems: TrenTargetItem[] = result.entries.map((entry) => ({
        slot: entry.slot,
        prodi: entry.prodi,
      }));
      return <TrenChart jalur={result.jalur} items={trenItems} />;
    }

    if (section === "callout") {
      return (
        <Callout tone="warning" title={copy.disclaimer.title}>
          <p>{copy.disclaimer.body}</p>
          <p className="mt-2">
            <strong>{copy.disclaimer.privacyTitle}:</strong>{" "}
            {copy.disclaimer.privacy}
          </p>
          <div className="mt-3">
            <Button
              variant="secondary"
              onClick={() => setMetodologiOpen(true)}
            >
              {copy.hasil.lihatMetodologi}
            </Button>
          </div>
        </Callout>
      );
    }

    if (section === "paywall") {
      return <PaywallPreview />;
    }

    return null;
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-section px-4 py-6 sm:py-10">
      {/* Hero section */}
      <header className="space-y-3 text-center">
        <p className="inline-block rounded-full border border-line bg-surface-muted px-3 py-1 text-xs font-semibold text-fg-muted">
          {copy.hero.badgeFree}
        </p>
        <div className="space-y-2">
          <p className="text-sm font-bold tracking-wide text-brand">
            {copy.hero.brand}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {copy.hero.title}
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-fg-muted sm:text-base">
            {copy.hero.subtitle}
          </p>
        </div>
      </header>

      {/* Form F1 */}
      <PredictionForm onSubmit={handleSubmit} onReset={handleReset} />

      {/* Hasil mengikuti urutan THEME.resultLayoutOrder */}
      {result && (
        <div
          ref={resultSectionRef}
          className="flex flex-col gap-section scroll-mt-4"
        >
          {THEME.resultLayoutOrder.map((section) => (
            <Fragment key={section}>{renderResultSection(section)}</Fragment>
          ))}
        </div>
      )}

      <MetodologiModal
        open={metodologiOpen}
        onClose={() => setMetodologiOpen(false)}
      />
    </main>
  );
}
