"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { copy } from "@/config/copy";
import { cn, focusRing } from "./cn";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((el) => {
    if (el.hasAttribute("inert")) return false;
    if (el.getClientRects().length === 0) return false;
    const style = window.getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none";
  });
}

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
  const onCloseRef = useRef(onClose);
  const backdropMouseDownRef = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    dialogRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusables = getFocusableElements(dialog);
        if (focusables.length === 0) {
          e.preventDefault();
          dialog.focus();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (
            !active ||
            active === first ||
            active === dialog ||
            !dialog.contains(active)
          ) {
            e.preventDefault();
            last.focus();
          }
        } else if (!active || active === last || !dialog.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        backdropMouseDownRef.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && backdropMouseDownRef.current) {
          onClose();
        }
        backdropMouseDownRef.current = false;
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-card border-2 border-line bg-surface shadow-popover outline-none sm:rounded-card",
          className
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b-2 border-line bg-surface-warm px-4 py-3.5 sm:px-card">
          <h2
            id={titleId}
            className="min-w-0 font-display text-lg font-bold tracking-tight text-fg"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className={cn(
              "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control border-2 border-line bg-surface text-fg hover:bg-surface-muted",
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

        <div className="overflow-y-auto overscroll-contain p-4 text-sm text-fg sm:p-card">
          {children}
        </div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t-2 border-line px-4 py-3 sm:px-card">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
