"use client";

import { motion, useReducedMotion } from "framer-motion";
import { copy } from "@/config/copy";
import { cn } from "@/components/ui";

const EASE_SNAPPY = [0.22, 1, 0.36, 1] as const;

const ACCENT_STYLES = {
  blue: {
    card: "bg-bento-blue",
    iconBox: "bg-bento-blue-icon text-fg",
    tagText: "text-bento-blue-fg",
  },
  yellow: {
    card: "bg-bento-yellow",
    iconBox: "bg-accent-yellow text-accent-yellow-fg",
    tagText: "text-status-target-fg",
  },
  green: {
    card: "bg-bento-green",
    iconBox: "bg-status-safe-soft text-status-safe-fg",
    tagText: "text-status-safe-fg",
  },
} as const;

function BentoIcon({ id }: { id: string }) {
  const common = {
    "aria-hidden": true,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "size-6",
  };

  if (id === "data") {
    return (
      <svg {...common}>
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
      </svg>
    );
  }
  if (id === "ai") {
    return (
      <svg {...common}>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function BentoBenefits() {
  const prefersReduced = useReducedMotion();

  return (
    <section
      id="keunggulan"
      aria-labelledby="keunggulan-heading"
      className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
    >
      <motion.div
        initial={prefersReduced ? false : { opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: "some" }}
        transition={{ duration: 0.35, ease: EASE_SNAPPY }}
        className="mb-6 space-y-2 sm:mb-8"
      >
        <span className="inline-block rounded-lg border-2 border-line bg-surface px-3 py-1 font-display text-xs font-bold tracking-wider text-brand shadow-pill">
          {copy.bento.eyebrow}
        </span>
        <h2
          id="keunggulan-heading"
          className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl"
        >
          {copy.bento.title}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed font-medium text-fg-muted sm:text-base">
          {copy.bento.subtitle}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-3">
        {copy.bento.items.map((item, idx) => {
          const style = ACCENT_STYLES[item.accent];
          return (
            <motion.div
              key={item.id}
              initial={prefersReduced ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: "some" }}
              transition={{
                duration: 0.38,
                delay: idx * 0.09,
                ease: EASE_SNAPPY,
              }}
              className="h-full min-w-0"
            >
              <article
                className={cn(
                  "group flex h-full flex-col justify-between gap-5 rounded-card border-2 border-line p-5 shadow-card transition-transform duration-200 hover:-translate-x-[1px] hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none sm:p-6",
                  style.card
                )}
              >
                <div className="space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div
                      className={cn(
                        "inline-flex size-12 shrink-0 items-center justify-center rounded-control border-2 border-line shadow-control transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none",
                        style.iconBox
                      )}
                    >
                      <BentoIcon id={item.id} />
                    </div>
                    <span className="inline-flex items-center rounded-full border-2 border-line bg-surface px-2.5 py-1 text-xs leading-none font-bold text-fg shadow-pill">
                      {item.statusLabel}
                    </span>
                  </div>

                  <h3 className="font-display text-xl leading-snug font-bold tracking-tight text-fg">
                    {item.title}
                  </h3>

                  <p className="text-sm leading-relaxed font-medium text-fg-muted">
                    {item.description}
                  </p>
                </div>

                <div className="pt-1">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border-2 border-line bg-surface px-3 py-1 text-xs font-bold shadow-pill",
                      style.tagText
                    )}
                  >
                    {item.tag}
                  </span>
                </div>
              </article>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
