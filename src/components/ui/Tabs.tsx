"use client";

import { useId, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn, focusRing } from "./cn";

export interface TabOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface TabsProps<T extends string = string> {
  options: readonly TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  getPanelId?: (value: T) => string;
  className?: string;
}

export function Tabs<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel,
  getPanelId,
  className,
}: TabsProps<T>) {
  const baseId = useId();
  const indicatorLayoutId = `${baseId}-active-pill`;
  const prefersReduced = useReducedMotion();

  const hasSelectedEnabled = options.some(
    (opt) => opt.value === value && !opt.disabled
  );
  const firstEnabledIndex = options.findIndex((opt) => !opt.disabled);

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const enabledIndexes = options
      .map((opt, idx) => (opt.disabled ? -1 : idx))
      .filter((idx) => idx !== -1);

    if (enabledIndexes.length === 0) return;

    const currentPos = enabledIndexes.indexOf(index);
    let nextIndex: number | null = null;

    if (e.key === "ArrowRight") {
      nextIndex = enabledIndexes[(currentPos + 1) % enabledIndexes.length];
    } else if (e.key === "ArrowLeft") {
      nextIndex =
        enabledIndexes[
          (currentPos - 1 + enabledIndexes.length) % enabledIndexes.length
        ];
    } else if (e.key === "Home") {
      nextIndex = enabledIndexes[0];
    } else if (e.key === "End") {
      nextIndex = enabledIndexes[enabledIndexes.length - 1];
    }

    if (nextIndex !== null) {
      e.preventDefault();
      onChange(options[nextIndex].value);
      const nextEl = document.getElementById(`${baseId}-tab-${nextIndex}`);
      nextEl?.focus();
    }
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex min-w-0 flex-wrap gap-1.5 rounded-control border-2 border-line bg-surface-muted p-1",
        className
      )}
    >
      {options.map((opt, idx) => {
        const isSelected = opt.value === value;
        const isTabbable =
          !opt.disabled &&
          (isSelected || (!hasSelectedEnabled && idx === firstEnabledIndex));

        return (
          <button
            key={opt.value}
            id={`${baseId}-tab-${idx}`}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={getPanelId ? getPanelId(opt.value) : undefined}
            tabIndex={isTabbable ? 0 : -1}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              "relative inline-flex min-h-11 min-w-[min(100%,4.5rem)] flex-1 cursor-pointer items-center justify-center rounded-lg px-2.5 py-2 text-center font-display text-xs leading-snug font-bold sm:px-3 sm:text-sm",
              "transition-colors duration-150 motion-reduce:transition-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              focusRing,
              isSelected
                ? "text-accent-yellow-fg"
                : "text-fg-muted hover:text-fg"
            )}
          >
            {isSelected && (
              <motion.span
                layoutId={indicatorLayoutId}
                aria-hidden="true"
                transition={
                  prefersReduced
                    ? { duration: 0 }
                    : {
                        type: "spring",
                        stiffness: 520,
                        damping: 36,
                        mass: 0.7,
                      }
                }
                className="absolute inset-0 rounded-lg border-2 border-line bg-accent-yellow shadow-pill"
              />
            )}
            <span className="relative z-10 min-w-0 break-words">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
