"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import type { AnalyzeResponseBody } from "@/app/api/analyze/route";
import { APP_CONFIG, type MetricEvent } from "@/config/app.config";
import { copy } from "@/config/copy";
import { trackMetric } from "@/lib/metrics";
import {
  Button,
  Card,
  Input,
  Modal,
  cn,
  focusRing,
  tactileCardButton,
} from "@/components/ui";
import type { PredictionFormPayload } from "./PredictionForm";

export interface PaywallPreviewProps {
  payload: PredictionFormPayload;
  onUnlockClick: () => void;
  onBetaSuccess: (result: AnalyzeResponseBody) => void;
}

function buildAnalyzeBody(payload: PredictionFormPayload, accessCode: string) {
  if (payload.jalur === "snbt") {
    return {
      jalur: "snbt" as const,
      accessCode,
      pilihan1Kode: payload.pilihan1.kode_prodi,
      pilihan2Kode: payload.pilihan2?.kode_prodi ?? null,
      snbtInput: payload.snbtInput,
    };
  }
  return {
    jalur: "snbp" as const,
    accessCode,
    pilihan1Kode: payload.pilihan1.kode_prodi,
    pilihan2Kode: payload.pilihan2?.kode_prodi ?? null,
    snbpProfile: payload.snbpProfile,
    pilihan1HasAlumni: payload.pilihan1HasAlumni,
    pilihan2HasAlumni: payload.pilihan2HasAlumni,
  };
}

/**
 * Blok Fitur Premium & Beta (F4 + Fake-door Test menyatu dengan alur Beta).
 * - Mode Beta (`isBetaMode: true`): satu blok terpadu menampilkan:
 *   1) Strategi Pilihan AI (Beta Gratis via kode kuesioner 1 menit)
 *   2) Dua fitur lanjutan berlabel "Segera Hadir" (Tabel 10 Alternatif + Target 60/75/90%,
 *      dan Simulator Susunan Pilihan) untuk uji minat (fake-door test) tanpa menerima pembayaran.
 * - Mode Berbayar (`isBetaMode: false`): tampil sebagai blurred overlay yang
 *   membuka `PaywallModal`.
 *
 * Isi F6 tidak pernah ada di klien sebelum kode akses tervalidasi di server.
 * Kode akses hanya disimpan di React state (memori halaman), bukan storage.
 */
export function PaywallPreview({
  payload,
  onUnlockClick,
  onBetaSuccess,
}: PaywallPreviewProps) {
  const isBetaMode = APP_CONFIG.paywall.isBetaMode;

  const [accessCode, setAccessCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  const [fakeDoorModalFeature, setFakeDoorModalFeature] = useState<
    string | null
  >(null);

  function handleFakeDoorClick(event: MetricEvent, featureTitle: string) {
    trackMetric(event);
    setFakeDoorModalFeature(featureTitle);
  }

  async function handleBetaSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = accessCode.trim();
    if (!trimmed) {
      setErrorMessage(copy.paywall.codeRequired);
      return;
    }

    setSubmitting(true);
    setErrorMessage(undefined);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildAnalyzeBody(payload, trimmed)),
      });

      if (response.status === 401) {
        setErrorMessage(copy.error.invalidCode);
        return;
      }
      if (response.status === 403) {
        setErrorMessage(copy.error.codeExhausted);
        return;
      }
      if (response.status === 429) {
        setErrorMessage(copy.error.rateLimited);
        return;
      }
      if (response.status === 400) {
        setErrorMessage(copy.error.badRequest);
        return;
      }
      if (!response.ok) {
        setErrorMessage(copy.error.generic);
        return;
      }

      const data = (await response.json()) as AnalyzeResponseBody;
      setAccessCode("");
      setErrorMessage(undefined);
      onBetaSuccess(data);
    } catch {
      setErrorMessage(copy.error.network);
    } finally {
      setSubmitting(false);
    }
  }

  if (isBetaMode) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10, scale: 0.985 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card as="section" noPadding className="overflow-hidden">
            {/* Header Ungu AI + Chip Beta agar fitur andalan AI langsung menonjol */}
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
                  {copy.paywall.beta.aiCardTitle}
                </h2>
              </div>
              <span className="shrink-0 rounded-full border-2 border-line bg-accent-yellow px-3 py-0.5 text-xs font-bold text-accent-yellow-fg shadow-pill">
                {copy.paywall.beta.aiCardBadge}
              </span>
            </div>

            <div className="space-y-4 bg-surface p-4 sm:p-5">
              {/* 1. Strategi Pilihan AI (Beta Gratis) */}
              <div className="space-y-3">
                <p className="text-sm leading-relaxed font-medium text-fg-muted">
                  {copy.paywall.beta.aiCardBody}
                </p>

                <a
                  href={APP_CONFIG.externalLinks.feedbackFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackMetric("klik_paywall");
                    trackMetric("klik_fd_ai");
                  }}
                  className={cn(
                    "inline-flex min-h-11 w-full items-center justify-center rounded-control border-2 border-line bg-brand px-4 py-2.5 text-center text-sm leading-snug font-bold text-brand-fg hover:bg-brand-hover",
                    tactileCardButton,
                    focusRing
                  )}
                >
                  {copy.paywall.beta.questionnaireButton}
                </a>

                <form
                  onSubmit={handleBetaSubmit}
                  noValidate
                  className="space-y-2 pt-1"
                >
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start">
                    <Input
                      label={copy.paywall.codeLabel}
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder={copy.paywall.codePlaceholder}
                      value={accessCode}
                      onChange={(e) => {
                        setAccessCode(e.target.value);
                        if (errorMessage) setErrorMessage(undefined);
                      }}
                      error={errorMessage}
                      disabled={submitting}
                      containerClassName="min-w-0 flex-1"
                      required
                    />
                    <Button
                      type="submit"
                      variant="accent"
                      isLoading={submitting}
                      className="min-h-12 w-full whitespace-nowrap sm:mt-[22px] sm:w-auto sm:shrink-0"
                    >
                      {submitting
                        ? copy.common.loading
                        : copy.paywall.codeSubmit}
                    </Button>
                  </div>
                  <p className="text-xs font-medium text-fg-muted">
                    {copy.paywall.codeHelper}
                  </p>
                </form>
              </div>

              {/* 2. Fitur Lanjutan (Fake-door test — ringkas 2 kolom) */}
              <div className="space-y-2.5 border-t-2 border-line-soft pt-3.5">
                <h3 className="font-display text-xs font-bold tracking-wider text-fg-muted uppercase">
                  {copy.paywall.fakeDoor.sectionTitle}
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {copy.paywall.fakeDoor.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex min-w-0 flex-col justify-between gap-3 rounded-control border-2 border-line bg-surface-warm p-3.5"
                    >
                      <div className="space-y-1">
                        <h4 className="font-display text-sm leading-snug font-bold text-fg">
                          {item.title}
                        </h4>
                        <p className="text-xs leading-relaxed text-fg-muted">
                          {item.description}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        fullWidth
                        onClick={() =>
                          handleFakeDoorClick(item.event, item.title)
                        }
                      >
                        {copy.paywall.fakeDoor.interestButton}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <Modal
          open={fakeDoorModalFeature !== null}
          onClose={() => setFakeDoorModalFeature(null)}
          title={copy.paywall.fakeDoor.modalTitle}
        >
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-fg-muted">
              {copy.paywall.fakeDoor.modalBody(fakeDoorModalFeature ?? "")}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setFakeDoorModalFeature(null)}
              >
                {copy.common.close}
              </Button>
              <a
                href={APP_CONFIG.externalLinks.feedbackFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex min-h-11 items-center justify-center rounded-control border-2 border-line bg-brand px-4 py-2.5 text-center text-sm font-bold text-brand-fg hover:bg-brand-hover",
                  tactileCardButton,
                  focusRing
                )}
              >
                {copy.paywall.fakeDoor.modalCta}
              </a>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.985 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card
        titleAs="h2"
        title={copy.paywall.lockedTitle}
        description={copy.paywall.lockedBody}
      >
        <div className="relative overflow-hidden rounded-control border-2 border-line bg-surface-muted p-4">
          <div
            aria-hidden="true"
            className="pointer-events-none select-none space-y-3 blur-sm"
          >
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-bold text-fg-muted">
                {copy.paywall.aiTitle}
              </p>
              <div className="h-16 rounded-control bg-surface" />
            </div>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/70 p-4 text-center">
            <Button variant="primary" size="lg" onClick={onUnlockClick}>
              {copy.paywall.unlockButton}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
