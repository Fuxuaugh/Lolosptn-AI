"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { copy } from "@/config/copy";
import { cn, focusRing, tactileCardButton } from "@/components/ui";
import { BentoBenefits } from "./BentoBenefits";
import { FaqSection } from "./FaqSection";
import { Footer } from "./Footer";
import { HeroSection } from "./HeroSection";
import { MetodologiModal } from "./MetodologiModal";
import { Navbar } from "./Navbar";

export function LandingPage() {
  const [metodologiOpen, setMetodologiOpen] = useState(false);
  const prefersReduced = useReducedMotion();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar activeRoute="home" />

      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <HeroSection />
        <BentoBenefits />
        <FaqSection onOpenMetodologi={() => setMetodologiOpen(true)} />

        {/* Blok CTA Penutup menuju /kalkulator */}
        <section
          aria-labelledby="closing-cta-heading"
          className="mx-auto w-full max-w-6xl px-4 pt-2 pb-12 sm:px-6 sm:pb-16 lg:px-8"
        >
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: "some" }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-start justify-between gap-6 rounded-card border-2 border-line bg-accent-yellow p-5 shadow-card sm:p-8 lg:flex-row lg:items-center"
          >
            <div className="min-w-0 max-w-2xl space-y-2">
              <span className="inline-block rounded-lg border-2 border-line bg-surface px-3 py-1 font-display text-xs font-bold tracking-wider text-fg shadow-pill">
                {copy.closingCta.eyebrow}
              </span>
              <h2
                id="closing-cta-heading"
                className="font-display text-2xl font-bold tracking-tight text-balance text-accent-yellow-fg sm:text-3xl"
              >
                {copy.closingCta.title}
              </h2>
              <p className="text-sm leading-relaxed font-medium text-accent-yellow-fg sm:text-base">
                {copy.closingCta.subtitle}
              </p>
            </div>

            <Link
              href="/kalkulator"
              className={cn(
                "group inline-flex min-h-13 w-full shrink-0 items-center justify-center gap-2 rounded-control border-2 border-line bg-brand px-6 text-base font-bold whitespace-nowrap text-brand-fg hover:bg-brand-hover sm:w-auto sm:px-7",
                tactileCardButton,
                focusRing
              )}
            >
              <span>{copy.closingCta.button}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none"
              >
                <path d="M4 10h12M11 5l5 5-5 5" />
              </svg>
            </Link>
          </motion.div>
        </section>
      </main>

      <Footer />

      <MetodologiModal
        open={metodologiOpen}
        onClose={() => setMetodologiOpen(false)}
      />
    </div>
  );
}
