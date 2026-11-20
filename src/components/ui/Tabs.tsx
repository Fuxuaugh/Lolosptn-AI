"use client";

import { useId, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
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
  className?: string;
}

export function Tabs<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: TabsProps<T>) {
  const baseId = useId();
  const indicatorLayoutId = `${baseId}-active-pill`;

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
        "grid auto-cols-fr grid-flow-col gap-1.5 rounded-control border-2 border-line bg-surface-muted p-1",
        className
      )}
    >
      {options.map((opt, idx) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            id={`${baseId}-tab-${idx}`}
            type="button"
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              "relative min-h-11 rounded-lg px-3 font-display text-sm font-bold",
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
                transition={{
                  type: "spring",
                  stiffness: 520,
                  damping: 36,
                  mass: 0.7,
                }}
                className="absolute inset-0 rounded-lg border-2 border-line bg-accent-yellow shadow-pill"
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
