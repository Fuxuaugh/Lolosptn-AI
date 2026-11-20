"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import type { AnalyzeResponseBody } from "@/app/api/analyze/route";
import { APP_CONFIG } from "@/config/app.config";
import { copy } from "@/config/copy";
import { trackMetric } from "@/lib/metrics";
import {
  Button,
  Card,
  Input,
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
 * Blok Akses Strategi AI & Alternatif Prodi (F4).
 * - Mode Beta (`isBetaMode: true`): tampil langsung inline (tanpa QRIS) dengan
 *   tombol kuesioner 1 menit & form verifikasi kode akses.
 * - Mode Berbayar (`isBetaMode: false`): tampil sebagai blurred overlay yang
 *   membuka `PaywallModal` (QRIS + WhatsApp Admin).
 *
 * Isi F5 & F6 tidak pernah ada di klien sebelum kode akses tervalidasi di server.
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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10, scale: 0.985 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card as="section" noPadding className="overflow-hidden">
          {/* Header Kuning Beta */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-line bg-accent-yellow px-5 py-3.5">
            <h3 className="font-display text-base font-bold tracking-tight text-accent-yellow-fg">
              {copy.paywall.beta.headerTitle}
            </h3>
            <span className="rounded-full border-2 border-line bg-surface px-3 py-0.5 text-xs font-bold text-fg">
              {copy.paywall.beta.headerChip}
            </span>
          </div>

          {/* Body Putih */}
          <div className="space-y-4 bg-surface p-5">
            <p className="text-sm leading-relaxed font-medium text-fg-muted">
              {copy.paywall.beta.intro}
            </p>

            <a
              href={APP_CONFIG.externalLinks.feedbackFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackMetric("klik_paywall")}
              className={cn(
                "inline-flex min-h-13 w-full items-center justify-center rounded-control border-2 border-line bg-brand px-5 text-center text-sm font-bold text-brand-fg hover:bg-brand-hover sm:text-base",
                tactileCardButton,
                focusRing
              )}
            >
              {copy.paywall.beta.questionnaireButton}
            </a>

            <form
              onSubmit={handleBetaSubmit}
              noValidate
              className="space-y-3 border-t-2 border-line-soft pt-4"
            >
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
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
                  containerClassName="flex-1"
                  required
                />
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  isLoading={submitting}
                  className="sm:w-auto sm:shrink-0"
                >
                  {submitting ? copy.common.loading : copy.paywall.codeSubmit}
                </Button>
              </div>
              <p className="text-xs font-medium text-fg-muted">
                {copy.paywall.codeHelper}
              </p>
            </form>
          </div>
        </Card>
      </motion.div>
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
        title={copy.paywall.lockedTitle}
        description={copy.paywall.lockedBody}
      >
        <div className="relative overflow-hidden rounded-control border-2 border-line bg-surface-muted p-4">
          <div
            aria-hidden="true"
            className="pointer-events-none select-none space-y-3 blur-sm"
          >
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-fg-muted">
                {copy.paywall.alternativesTitle}
              </p>
              <div className="h-10 rounded-control bg-surface" />
              <div className="h-10 rounded-control bg-surface" />
              <div className="h-10 rounded-control bg-surface" />
            </div>
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
