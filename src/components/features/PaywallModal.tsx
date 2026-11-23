"use client";

import { useState, type FormEvent } from "react";
import type { AnalyzeResponseBody } from "@/app/api/analyze/route";
import { APP_CONFIG } from "@/config/app.config";
import { copy } from "@/config/copy";
import { trackMetric } from "@/lib/metrics";
import {
  Button,
  Input,
  Modal,
  cn,
  focusRing,
  tactileCardButton,
  tactileControlButton,
} from "@/components/ui";
import type { PredictionFormPayload } from "./PredictionForm";

export interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  payload: PredictionFormPayload;
  onSuccess: (result: AnalyzeResponseBody) => void;
}

function buildAnalyzeRequestBody(
  payload: PredictionFormPayload,
  accessCode: string
) {
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

function QrisPlaceholder() {
  return (
    <div
      role="img"
      aria-label={copy.paywall.qrisAlt}
      className="mx-auto flex w-full max-w-xs flex-col items-center gap-2 rounded-card border-2 border-dashed border-line bg-surface-muted p-4 text-center"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 96 96"
        fill="none"
        className="size-24 text-fg"
      >
        <rect
          x="4"
          y="4"
          width="28"
          height="28"
          rx="4"
          stroke="currentColor"
          strokeWidth="4"
        />
        <rect x="12" y="12" width="12" height="12" rx="1" fill="currentColor" />
        <rect
          x="64"
          y="4"
          width="28"
          height="28"
          rx="4"
          stroke="currentColor"
          strokeWidth="4"
        />
        <rect x="72" y="12" width="12" height="12" rx="1" fill="currentColor" />
        <rect
          x="4"
          y="64"
          width="28"
          height="28"
          rx="4"
          stroke="currentColor"
          strokeWidth="4"
        />
        <rect x="12" y="72" width="12" height="12" rx="1" fill="currentColor" />
        <rect x="42" y="10" width="10" height="10" rx="1" fill="currentColor" />
        <rect x="42" y="28" width="10" height="10" rx="1" fill="currentColor" />
        <rect x="10" y="42" width="12" height="12" rx="1" fill="currentColor" />
        <rect x="30" y="42" width="12" height="12" rx="1" fill="currentColor" />
        <rect x="52" y="42" width="12" height="12" rx="1" fill="currentColor" />
        <rect x="74" y="42" width="12" height="12" rx="1" fill="currentColor" />
        <rect x="44" y="64" width="12" height="12" rx="1" fill="currentColor" />
        <rect x="66" y="64" width="20" height="10" rx="1" fill="currentColor" />
        <rect x="44" y="82" width="22" height="10" rx="1" fill="currentColor" />
        <rect x="74" y="80" width="12" height="12" rx="1" fill="currentColor" />
      </svg>
      <p className="text-sm font-semibold text-fg">
        {copy.paywall.qrisPlaceholderTitle}
      </p>
      <p className="text-xs text-fg-muted">
        {copy.paywall.qrisPlaceholderNote}
      </p>
    </div>
  );
}

export function PaywallModal({
  open,
  onClose,
  payload,
  onSuccess,
}: PaywallModalProps) {
  // Kode akses disimpan HANYA di React state (memori halaman), dilarang ke localStorage/sessionStorage
  const [accessCode, setAccessCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  function handleClose() {
    if (submitting) return;
    setErrorMessage(undefined);
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
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
        body: JSON.stringify(buildAnalyzeRequestBody(payload, trimmed)),
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
      onSuccess(data);
    } catch {
      setErrorMessage(copy.error.network);
    } finally {
      setSubmitting(false);
    }
  }

  const isBetaMode = APP_CONFIG.paywall.isBetaMode;
  const modalTitle = isBetaMode
    ? copy.paywall.beta.modalTitle
    : copy.paywall.modalTitle;

  return (
    <Modal open={open} onClose={handleClose} title={modalTitle}>
      <div className="space-y-4">
        {isBetaMode ? (
          /* Mode Beta Gratis: kuesioner 1 menit untuk kode akses gratis */
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-fg-muted">
              {copy.paywall.beta.intro}
            </p>
            <p className="text-sm font-medium text-fg">
              {copy.paywall.beta.step1}
            </p>
            <a
              href={APP_CONFIG.externalLinks.feedbackFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex min-h-12 w-full items-center justify-center rounded-control border-2 border-line bg-brand px-5 py-2.5 text-center text-sm leading-snug font-bold text-brand-fg hover:bg-brand-hover sm:text-base",
                tactileCardButton,
                focusRing
              )}
            >
              {copy.paywall.beta.questionnaireButton}
            </a>
          </div>
        ) : (
          /* Mode Berbayar (QRIS + konfirmasi WhatsApp Admin) — aktif saat isBetaMode: false */
          <>
            <div className="space-y-2.5">
              <p className="text-sm font-medium text-fg">
                {copy.paywall.step1}
              </p>
              <QrisPlaceholder />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-fg">
                {copy.paywall.step2}
              </p>
              <a
                href={APP_CONFIG.externalLinks.whatsappAdminUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackMetric("klik_wa")}
                className={cn(
                  "inline-flex min-h-11 w-full items-center justify-center rounded-control border-2 border-line bg-surface px-4 py-2 text-center text-sm font-bold text-fg hover:bg-surface-muted",
                  tactileControlButton,
                  focusRing
                )}
              >
                {copy.paywall.whatsappButton}
              </a>
            </div>
          </>
        )}

        {/* Form Kode Akses (aktif di mode Beta maupun mode Berbayar) */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-3 border-t-2 border-line-soft pt-4"
        >
          <p className="text-sm font-medium text-fg">
            {isBetaMode ? copy.paywall.beta.step2 : copy.paywall.step3}
          </p>
          <Input
            label={copy.paywall.codeLabel}
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder={copy.paywall.codePlaceholder}
            helperText={copy.paywall.codeHelper}
            value={accessCode}
            onChange={(e) => {
              setAccessCode(e.target.value);
              if (errorMessage) setErrorMessage(undefined);
            }}
            error={errorMessage}
            disabled={submitting}
            required
          />
          <Button
            type="submit"
            size="lg"
            variant={isBetaMode ? "secondary" : "primary"}
            fullWidth
            isLoading={submitting}
          >
            {submitting ? copy.paywall.submitting : copy.paywall.codeSubmit}
          </Button>
        </form>
      </div>
    </Modal>
  );
}
