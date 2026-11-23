"use client";

import { APP_CONFIG } from "@/config/app.config";
import { copy } from "@/config/copy";
import {
  Accordion,
  Button,
  Callout,
  Card,
  cn,
  focusRing,
  tactileControlButton,
} from "@/components/ui";

export interface FaqSectionProps {
  onOpenMetodologi: () => void;
}

export function FaqSection({ onOpenMetodologi }: FaqSectionProps) {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <span className="inline-block rounded-lg border-2 border-line bg-surface px-3 py-1 font-display text-xs font-bold tracking-wider text-brand shadow-pill">
            {copy.faq.eyebrow}
          </span>
          <h2
            id="faq-heading"
            className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl"
          >
            {copy.faq.title}
          </h2>
        </div>

        {/* FAQ Accordion 5 pertanyaan */}
        <Accordion
          items={copy.faq.items}
          defaultOpenIds={["cara-hitung", "tka-snbp"]}
        />

        {/* Disclaimer + Laporan Anonim sejajar 2 kolom di desktop agar nyaman dibaca */}
        <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <Callout tone="warning" title={copy.disclaimer.title} className="h-full">
              <p>{copy.disclaimer.body}</p>
              <p className="mt-2">
                <strong>{copy.disclaimer.privacyTitle}:</strong>{" "}
                {copy.disclaimer.privacy}
              </p>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  onClick={onOpenMetodologi}
                  className="w-full sm:w-auto"
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
              title={copy.feedback.title}
              description={copy.feedback.body}
              className="flex h-full flex-col justify-between"
            >
              <div className="pt-1">
                <a
                  href={APP_CONFIG.externalLinks.feedbackFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "group inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control border-2 border-line bg-surface px-4 text-sm font-bold text-fg hover:bg-surface-muted sm:w-auto",
                    tactileControlButton,
                    focusRing
                  )}
                >
                  <span>{copy.feedback.cta}</span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                  >
                    <path d="M7 13L13 7M8 7h5v5" />
                  </svg>
                </a>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
