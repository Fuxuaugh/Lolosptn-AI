"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { copy } from "@/config/copy";
import { cn, focusRing } from "./cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  closeLabel = copy.common.close,
  className,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    dialogRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-card border-2 border-line bg-surface shadow-popover outline-none sm:rounded-card",
          className
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b-2 border-line bg-surface-warm px-card py-3.5 sm:rounded-t-[14px]">
          <h2
            id={titleId}
            className="font-display text-lg font-bold tracking-tight text-fg"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className={cn(
              "inline-flex size-11 shrink-0 items-center justify-center rounded-control border-2 border-line bg-surface text-fg hover:bg-surface-muted",
              "transition-colors motion-reduce:transition-none",
              focusRing
            )}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              className="size-5"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-card text-sm text-fg">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t-2 border-line px-card py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
