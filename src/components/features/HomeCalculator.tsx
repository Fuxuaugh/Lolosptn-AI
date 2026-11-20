"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { AnalyzeResponseBody } from "@/app/api/analyze/route";
import { APP_CONFIG, type Jalur } from "@/config/app.config";
import { copy } from "@/config/copy";
import { THEME, type ResultSection } from "@/config/theme";
import {
  fetchPtnDetail,
  type ProdiDetail,
  type ProdiIndexItem,
} from "@/lib/dataset";
import { trackMetric } from "@/lib/metrics";
import {
  predictSnbp,
  predictSnbt,
  toSnbpTarget,
  toSnbtTarget,
  type PredictionResult,
} from "@/lib/prediction";
import {
  Button,
  Callout,
  Card,
  cn,
  focusRing,
  tactileControlButton,
} from "@/components/ui";
import { Footer } from "./Footer";
import { HasilKartu, type HasilPilihanItem } from "./HasilKartu";
import { MetodologiModal } from "./MetodologiModal";
import { Navbar } from "./Navbar";
import { PaywallModal } from "./PaywallModal";
import { PaywallPreview } from "./PaywallPreview";
import {
  PredictionForm,
  type PredictionFormPayload,
} from "./PredictionForm";
import { TrenChart, type TrenTargetItem } from "./TrenChart";
import { UnlockedAnalysis } from "./UnlockedAnalysis";

interface ComputedEntry {
  slot: 1 | 2;
  prodi: ProdiIndexItem;
  prediction: PredictionResult;
}

interface CalculationState {
  calcSeq: number;
  jalur: Jalur;
  payload: PredictionFormPayload;
  entries: ComputedEntry[];
}

export function HomeCalculator() {
  const [result, setResult] = useState<CalculationState | null>(null);
  const [detailsByKode, setDetailsByKode] = useState<
    Record<string, ProdiDetail | null>
  >({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [metodologiOpen, setMetodologiOpen] = useState(false);

  // State paywall & hasil F5/F6 hanya hidup di memori halaman (React state)
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [unlockedData, setUnlockedData] = useState<AnalyzeResponseBody | null>(
    null
  );

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

    // Reset hasil F5/F6 lama jika pengguna mengubah input & menghitung ulang
    setUnlockedData(null);
    setPaywallOpen(false);
    setDetailsLoading(true);
    setResult((prev) => ({
      calcSeq: (prev?.calcSeq ?? 0) + 1,
      jalur: payload.jalur,
      payload,
      entries,
    }));

    // Catat metrik anonim sesi selesai (fire-and-forget)
    trackMetric("sesi_selesai");

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
    setUnlockedData(null);
    setPaywallOpen(false);
  }

  function handleOpenPaywall() {
    trackMetric("klik_paywall");
    setPaywallOpen(true);
  }

  function handleUnlockSuccess(data: AnalyzeResponseBody) {
    setPaywallOpen(false);
    setUnlockedData(data);
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
      return (
        <HasilKartu
          jalur={result.jalur}
          items={hasilItems}
          animationKey={result.calcSeq}
        />
      );
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
      return (
        <AnimatePresence mode="wait">
          {unlockedData ? (
            <UnlockedAnalysis
              key={`unlocked-${result.calcSeq}`}
              jalur={result.jalur}
              data={unlockedData}
            />
          ) : (
            <PaywallPreview
              key={`locked-${result.calcSeq}`}
              payload={result.payload}
              onUnlockClick={handleOpenPaywall}
              onBetaSuccess={handleUnlockSuccess}
            />
          )}
        </AnimatePresence>
      );
    }

    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar activeRoute="kalkulator" />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-6 space-y-2 sm:mb-8">
          <span className="inline-block rounded-lg border-2 border-line bg-accent-yellow px-3 py-1 font-display text-xs font-bold tracking-wider text-accent-yellow-fg shadow-pill">
            {copy.calcSection.eyebrow}
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-fg sm:text-4xl">
            {copy.calcSection.title}
          </h1>
          <p className="max-w-2xl text-sm font-medium text-fg-muted sm:text-base">
            {copy.calcSection.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Kolom Kiri: Form F1 */}
          <div className="lg:col-span-5">
            <PredictionForm onSubmit={handleSubmit} onReset={handleReset} />
          </div>

          {/* Kolom Kanan: Hasil sesuai THEME.resultLayoutOrder */}
          <div
            ref={resultSectionRef}
            className="flex scroll-mt-24 flex-col gap-6 lg:col-span-7"
          >
            {result ? (
              THEME.resultLayoutOrder.map((section) => (
                <Fragment key={section}>
                  {renderResultSection(section)}
                </Fragment>
              ))
            ) : (
              <>
                <Card
                  as="div"
                  variant="flat"
                  title={copy.calcSection.emptyStateTitle}
                  description={copy.calcSection.emptyStateBody}
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border-2 border-line bg-status-safe-soft px-3 py-1 text-xs font-bold text-status-safe-fg">
                      {copy.hasil.legend.safe}
                    </span>
                    <span className="rounded-full border-2 border-line bg-status-target-soft px-3 py-1 text-xs font-bold text-status-target-fg">
                      {copy.hasil.legend.target}
                    </span>
                    <span className="rounded-full border-2 border-line bg-status-reach-soft px-3 py-1 text-xs font-bold text-status-reach-fg">
                      {copy.hasil.legend.reach}
                    </span>
                  </div>
                </Card>

                {/* Kotak Disclaimer + Metodologi tetap tersedia sebelum menghitung */}
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
              </>
            )}

            {/* F7: Laporan Hasil Seleksi Anonim */}
            <Card
              as="div"
              variant="flat"
              title={copy.feedback.title}
              description={copy.feedback.body}
            >
              <a
                href={APP_CONFIG.externalLinks.feedbackFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex min-h-11 items-center justify-center rounded-control border-2 border-line bg-surface px-4 text-sm font-bold text-fg hover:bg-surface-muted",
                  tactileControlButton,
                  focusRing
                )}
              >
                {copy.feedback.cta}
              </a>
            </Card>
          </div>
        </div>
      </main>

      <Footer />

      <MetodologiModal
        open={metodologiOpen}
        onClose={() => setMetodologiOpen(false)}
      />

      {result && (
        <PaywallModal
          open={paywallOpen}
          onClose={() => setPaywallOpen(false)}
          payload={result.payload}
          onSuccess={handleUnlockSuccess}
        />
      )}
    </div>
  );
}
