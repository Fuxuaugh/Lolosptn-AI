"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { AnalyzeResponseBody } from "@/app/api/analyze/route";
import type { RecommendResponseBody } from "@/app/api/recommend/route";
import { APP_CONFIG, type Jalur } from "@/config/app.config";
import { copy } from "@/config/copy";
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
  Tabs,
  cn,
  focusRing,
  tactileControlButton,
  type TabOption,
} from "@/components/ui";
import { Footer } from "./Footer";
import { FreeInsightsCard } from "./FreeInsightsCard";
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

type DetailTabKey = "insights" | "tren";

const DETAIL_TABS: readonly TabOption<DetailTabKey>[] = [
  { value: "insights", label: copy.calcSection.detailTabs.insights },
  { value: "tren", label: copy.calcSection.detailTabs.tren },
];

export function HomeCalculator() {
  const [result, setResult] = useState<CalculationState | null>(null);
  const [detailsByKode, setDetailsByKode] = useState<
    Record<string, ProdiDetail | null>
  >({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [metodologiOpen, setMetodologiOpen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] =
    useState<DetailTabKey>("insights");

  // State hasil gratis (/api/recommend: 3 alternatif + ringkasan otomatis)
  const [freeInsights, setFreeInsights] =
    useState<RecommendResponseBody | null>(null);
  const [freeInsightsLoading, setFreeInsightsLoading] = useState(false);
  const [freeInsightsError, setFreeInsightsError] = useState(false);
  const [insightsRetrySeq, setInsightsRetrySeq] = useState(0);

  // State paywall & hasil F6 hanya hidup di memori halaman (React state)
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [unlockedData, setUnlockedData] = useState<AnalyzeResponseBody | null>(
    null
  );

  const resultSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!result) return;

    const controller = new AbortController();
    const payload = result.payload;
    const body =
      payload.jalur === "snbt"
        ? {
            jalur: "snbt" as const,
            pilihan1Kode: payload.pilihan1.kode_prodi,
            pilihan2Kode: payload.pilihan2?.kode_prodi ?? null,
            snbtInput: payload.snbtInput,
          }
        : {
            jalur: "snbp" as const,
            pilihan1Kode: payload.pilihan1.kode_prodi,
            pilihan2Kode: payload.pilihan2?.kode_prodi ?? null,
            snbpProfile: payload.snbpProfile,
            pilihan1HasAlumni: payload.pilihan1HasAlumni,
            pilihan2HasAlumni: payload.pilihan2HasAlumni,
          };

    fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as RecommendResponseBody;
      })
      .then((data) => {
        setFreeInsights(data);
        setFreeInsightsError(false);
        setFreeInsightsLoading(false);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setFreeInsightsError(true);
        setFreeInsightsLoading(false);
      });

    return () => controller.abort();
  }, [result, insightsRetrySeq]);

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

    // Reset hasil lama jika pengguna mengubah input & menghitung ulang
    setUnlockedData(null);
    setPaywallOpen(false);
    setFreeInsights(null);
    setFreeInsightsError(false);
    setFreeInsightsLoading(true);
    setDetailsLoading(true);
    setActiveDetailTab("insights");
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
    setFreeInsights(null);
    setFreeInsightsLoading(false);
    setFreeInsightsError(false);
    setUnlockedData(null);
    setPaywallOpen(false);
  }

  function handleRetryInsights() {
    setFreeInsightsError(false);
    setFreeInsightsLoading(true);
    setInsightsRetrySeq((seq) => seq + 1);
  }

  function handleOpenPaywall() {
    trackMetric("klik_paywall");
    setPaywallOpen(true);
  }

  function handleUnlockSuccess(data: AnalyzeResponseBody) {
    setPaywallOpen(false);
    setUnlockedData(data);
  }

  const hasilItems: HasilPilihanItem[] = result
    ? result.entries.map((entry) => ({
        slot: entry.slot,
        prodi: entry.prodi,
        detail: detailsByKode[entry.prodi.kode_prodi] ?? null,
        detailLoading: detailsLoading,
        prediction: entry.prediction,
      }))
    : [];

  const trenItems: TrenTargetItem[] = result
    ? result.entries.map((entry) => ({
        slot: entry.slot,
        prodi: entry.prodi,
      }))
    : [];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar activeRoute="kalkulator" />

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 focus:outline-none sm:px-6 sm:py-10 lg:px-8"
      >
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

        {/* Baris 1 (Seimbang 2 Kolom): Form di Kiri | Hasil Peluang + Strategi AI di Kanan */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 lg:col-span-5">
            <PredictionForm onSubmit={handleSubmit} onReset={handleReset} />
          </div>

          <div
            ref={resultSectionRef}
            className="flex min-w-0 scroll-mt-24 flex-col gap-5 lg:col-span-7"
          >
            {result ? (
              <>
                <HasilKartu
                  jalur={result.jalur}
                  items={hasilItems}
                  animationKey={result.calcSeq}
                />

                {/* Fitur Andalan: Strategi Pilihan AI langsung terlihat tepat di bawah hasil */}
                <AnimatePresence mode="wait">
                  {unlockedData ? (
                    <UnlockedAnalysis
                      key={`unlocked-${result.calcSeq}`}
                      jalur={result.jalur}
                      data={unlockedData}
                      hideAlternatives
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
              </>
            ) : (
              <>
                <Card
                  as="div"
                  variant="flat"
                  titleAs="h2"
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

                <Card
                  as="div"
                  variant="flat"
                  titleAs="h2"
                  title={copy.feedback.title}
                  description={copy.feedback.body}
                >
                  <a
                    href={APP_CONFIG.externalLinks.feedbackFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex min-h-11 w-full items-center justify-center rounded-control border-2 border-line bg-surface px-4 text-center text-sm font-bold text-fg hover:bg-surface-muted sm:w-auto",
                      tactileControlButton,
                      focusRing
                    )}
                  >
                    {copy.feedback.cta}
                  </a>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Baris 2 & 3 (Lebar Penuh, Ringkas): Detail Tab (Ringkasan & 3 Alternatif | Tren) + Footer 2 Kolom */}
        {result && (
          <div className="mt-6 space-y-6">
            <Card as="section" aria-label={copy.calcSection.detailTabsLabel}>
              <h2 className="sr-only">{copy.calcSection.detailTabsLabel}</h2>
              <div className="space-y-5">
                <Tabs
                  options={DETAIL_TABS}
                  value={activeDetailTab}
                  onChange={setActiveDetailTab}
                  ariaLabel={copy.calcSection.detailTabsLabel}
                />

                <div
                  role="tabpanel"
                  aria-label={
                    activeDetailTab === "insights"
                      ? copy.calcSection.detailTabs.insights
                      : copy.calcSection.detailTabs.tren
                  }
                >
                  {activeDetailTab === "insights" ? (
                    <FreeInsightsCard
                      jalur={result.jalur}
                      data={freeInsights}
                      loading={freeInsightsLoading}
                      error={freeInsightsError}
                      onRetry={handleRetryInsights}
                      embedded
                    />
                  ) : (
                    <TrenChart
                      jalur={result.jalur}
                      items={trenItems}
                      embedded
                    />
                  )}
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="min-w-0 lg:col-span-7">
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
              </div>

              <div className="min-w-0 lg:col-span-5">
                <Card
                  as="div"
                  variant="flat"
                  titleAs="h2"
                  title={copy.feedback.title}
                  description={copy.feedback.body}
                  className="h-full"
                >
                  <a
                    href={APP_CONFIG.externalLinks.feedbackFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex min-h-11 w-full items-center justify-center rounded-control border-2 border-line bg-surface px-4 text-center text-sm font-bold text-fg hover:bg-surface-muted sm:w-auto",
                      tactileControlButton,
                      focusRing
                    )}
                  >
                    {copy.feedback.cta}
                  </a>
                </Card>
              </div>
            </div>
          </div>
        )}
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
