"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn, focusRing } from "./cn";

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

export interface AccordionProps {
  items: readonly AccordionItem[];
  defaultOpenIds?: readonly string[];
  headingAs?: "h2" | "h3" | "h4" | "div";
  className?: string;
}

export function Accordion({
  items,
  defaultOpenIds = [],
  headingAs: HeadingTag = "h3",
  className,
}: AccordionProps) {
  const baseId = useId();
  const prefersReduced = useReducedMotion();
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(defaultOpenIds)
  );

  function toggleItem(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleTriggerKeyDown(
    e: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    if (items.length === 0) return;

    let nextIndex: number | null = null;
    if (e.key === "ArrowDown") {
      nextIndex = (index + 1) % items.length;
    } else if (e.key === "ArrowUp") {
      nextIndex = (index - 1 + items.length) % items.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = items.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const targetId = `${baseId}-trigger-${items[nextIndex].id}`;
      document.getElementById(targetId)?.focus();
    }
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      {items.map((item, idx) => {
        const isOpen = openIds.has(item.id);
        const panelId = `${baseId}-panel-${item.id}`;
        const triggerId = `${baseId}-trigger-${item.id}`;

        return (
          <div
            key={item.id}
            className={cn(
              "min-w-0 rounded-card border-2 border-line bg-surface transition-all duration-150 motion-reduce:transform-none motion-reduce:transition-none",
              isOpen
                ? "shadow-card"
                : "shadow-control hover:-translate-x-[1px] hover:-translate-y-[1px]"
            )}
          >
            <HeadingTag className="m-0">
              <button
                id={triggerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={isOpen ? panelId : undefined}
                onClick={() => toggleItem(item.id)}
                onKeyDown={(e) => handleTriggerKeyDown(e, idx)}
                className={cn(
                  "flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-card px-4 py-3.5 text-left font-bold text-fg sm:gap-4 sm:px-5 sm:py-4",
                  focusRing
                )}
              >
                <span className="min-w-0 text-sm leading-snug sm:text-base">
                  {item.question}
                </span>
                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={
                    prefersReduced
                      ? { duration: 0 }
                      : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
                  }
                  className={cn(
                    "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-line transition-colors duration-150 motion-reduce:transition-none",
                    isOpen
                      ? "bg-accent-yellow text-accent-yellow-fg"
                      : "bg-surface-muted text-fg"
                  )}
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4"
                  >
                    <path d="M5 7.5l5 5 5-5" />
                  </svg>
                </motion.span>
              </button>
            </HeadingTag>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  initial={
                    prefersReduced ? { opacity: 1 } : { height: 0, opacity: 0 }
                  }
                  animate={
                    prefersReduced
                      ? { opacity: 1 }
                      : { height: "auto", opacity: 1 }
                  }
                  exit={
                    prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }
                  }
                  transition={
                    prefersReduced
                      ? { duration: 0 }
                      : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
                  }
                  className="overflow-hidden"
                >
                  <div className="border-t-2 border-line-soft px-4 pt-3.5 pb-4 text-sm leading-relaxed text-fg-muted sm:px-5 sm:pb-5">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
