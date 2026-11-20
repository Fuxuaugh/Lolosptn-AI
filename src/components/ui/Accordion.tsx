"use client";

import { useState } from "react";
import { cn, focusRing } from "./cn";

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

export interface AccordionProps {
  items: readonly AccordionItem[];
  defaultOpenIds?: readonly string[];
  className?: string;
}

export function Accordion({
  items,
  defaultOpenIds = [],
  className,
}: AccordionProps) {
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

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        const panelId = `accordion-panel-${item.id}`;
        const triggerId = `accordion-trigger-${item.id}`;

        return (
          <div
            key={item.id}
            className={cn(
              "rounded-card border-2 border-line bg-surface transition-shadow motion-reduce:transition-none",
              isOpen ? "shadow-card" : "shadow-control"
            )}
          >
            <button
              id={triggerId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggleItem(item.id)}
              className={cn(
                "flex min-h-14 w-full items-center justify-between gap-4 rounded-card px-5 py-4 text-left font-bold text-fg",
                focusRing
              )}
            >
              <span className="text-sm sm:text-base">{item.question}</span>
              <span
                aria-hidden="true"
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-line font-display text-base font-bold",
                  isOpen
                    ? "bg-accent-yellow text-accent-yellow-fg"
                    : "bg-surface-muted text-fg"
                )}
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>

            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                className="border-t-2 border-line-soft px-5 pt-3.5 pb-5 text-sm leading-relaxed text-fg-muted"
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
