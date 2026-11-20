"use client";

import { APP_CONFIG } from "@/config/app.config";
import { copy } from "@/config/copy";
import { Accordion, Button, Callout, Card, cn, focusRing } from "@/components/ui";

export interface FaqSectionProps {
  onOpenMetodologi: () => void;
}

export function FaqSection({ onOpenMetodologi }: FaqSectionProps) {
  return (
    <section
      id="faq"
      className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 pt-8 pb-12 sm:px-6 sm:pt-12 sm:pb-16 lg:px-8"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <span className="inline-block rounded-lg border-2 border-line bg-surface px-3 py-1 font-display text-xs font-bold tracking-wider text-brand shadow-pill">
            {copy.faq.eyebrow}
          </span>
          <h2 className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {copy.faq.title}
          </h2>
        </div>

        {/* FAQ Accordion 5 pertanyaan */}
        <Accordion
          items={copy.faq.items}
          defaultOpenIds={["cara-hitung", "tka-snbp"]}
        />

        {/* Kotak Disclaimer Kuning + Tombol Metodologi */}
        <Callout tone="warning" title={copy.disclaimer.title}>
          <p>{copy.disclaimer.body}</p>
          <p className="mt-2">
            <strong>{copy.disclaimer.privacyTitle}:</strong>{" "}
            {copy.disclaimer.privacy}
          </p>
          <div className="mt-4">
            <Button variant="secondary" onClick={onOpenMetodologi}>
              {copy.hasil.lihatMetodologi}
            </Button>
          </div>
        </Callout>

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
              "inline-flex min-h-11 items-center justify-center rounded-control border-2 border-line bg-surface px-4 text-sm font-bold text-fg shadow-control transition-all hover:bg-surface-muted active:translate-x-0.5 active:translate-y-0.5 active:shadow-none motion-reduce:transform-none motion-reduce:transition-none",
              focusRing
            )}
          >
            {copy.feedback.cta}
          </a>
        </Card>

        {/* Footer ringkas */}
        <footer className="flex flex-col items-center justify-between gap-2 border-t-2 border-line-soft pt-6 text-center text-xs sm:flex-row sm:text-left">
          <p className="font-display font-bold text-fg-muted">
            {copy.footer.brandNote}
          </p>
          <p className="font-medium text-fg-subtle">{copy.footer.tagline}</p>
        </footer>
      </div>
    </section>
  );
}
