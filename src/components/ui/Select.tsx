"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { copy } from "@/config/copy";
import { cn, focusRing } from "./cn";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SelectProps {
  id?: string;
  label: string;
  options: readonly SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  className?: string;
}

export function Select({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = copy.common.selectPlaceholder,
  searchPlaceholder = copy.common.searchPlaceholder,
  noResultsText = copy.common.noResults,
  helperText,
  error,
  disabled = false,
  required = false,
  clearable = false,
  className,
}: SelectProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const listboxId = `${triggerId}-listbox`;
  const helperId = `${triggerId}-helper`;
  const errorId = `${triggerId}-error`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.description?.toLowerCase().includes(q) ?? false)
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      searchRef.current?.focus();
    }
  }, [open]);

  function closeMenu(restoreFocus = false) {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }

  function selectValue(nextValue: string) {
    onChange(nextValue);
    closeMenu(true);
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu(true);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filtered.length > 0) {
        setActiveIndex((prev) => (prev + 1) % filtered.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filtered.length > 0) {
        setActiveIndex(
          (prev) => (prev - 1 + filtered.length) % filtered.length
        );
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filtered[activeIndex];
      if (target) {
        selectValue(target.value);
      }
    }
  }

  const describedBy =
    [error ? errorId : null, helperText ? helperId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div ref={containerRef} className={cn("relative flex flex-col gap-1.5", className)}>
      <label htmlFor={triggerId} className="text-sm font-medium text-fg">
        <span>{label}</span>
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-danger">
            *
          </span>
        )}
      </label>

      <div className="relative flex items-center">
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-describedby={describedBy}
          onClick={() => {
            if (disabled) return;
            if (open) {
              closeMenu(false);
            } else {
              setQuery("");
              setActiveIndex(0);
              setOpen(true);
            }
          }}
          className={cn(
            "flex min-h-11 w-full items-center justify-between gap-2 rounded-control border bg-surface px-3.5 text-left text-base",
            "transition-colors motion-reduce:transition-none",
            "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70",
            error ? "border-danger" : "border-line-strong",
            focusRing
          )}
        >
          <span
            className={cn(
              "min-w-0 truncate",
              selectedOption ? "text-fg" : "text-fg-muted"
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "size-4 shrink-0 text-fg-muted transition-transform motion-reduce:transition-none",
              open && "rotate-180"
            )}
          >
            <path d="M5 7.5l5 5 5-5" />
          </svg>
        </button>

        {clearable && value && !disabled && (
          <button
            type="button"
            aria-label={copy.common.clearSelection}
            onClick={() => onChange("")}
            className={cn(
              "ml-1 inline-flex size-11 shrink-0 items-center justify-center rounded-control border border-line text-fg-muted hover:bg-surface-muted hover:text-fg",
              focusRing
            )}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              className="size-4"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full right-0 left-0 z-40 mt-1.5 overflow-hidden rounded-control border border-line bg-surface shadow-popover">
          <div className="border-b border-line p-2">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className={cn(
                "min-h-11 w-full rounded-control border border-line bg-surface-muted px-3 text-sm text-fg placeholder:text-fg-muted",
                focusRing
              )}
            />
          </div>

          <ul
            id={listboxId}
            role="listbox"
            aria-label={label}
            className="max-h-60 overflow-y-auto p-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-center text-sm text-fg-muted">
                {noResultsText}
              </li>
            ) : (
              filtered.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isActive = idx === activeIndex;
                return (
                  <li key={opt.value} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => selectValue(opt.value)}
                      className={cn(
                        "flex min-h-11 w-full flex-col items-start justify-center rounded-control px-3 py-2 text-left text-sm",
                        "transition-colors motion-reduce:transition-none",
                        isSelected
                          ? "bg-brand text-brand-fg font-semibold"
                          : isActive
                            ? "bg-surface-muted text-fg"
                            : "text-fg hover:bg-surface-muted"
                      )}
                    >
                      <span className="w-full truncate">{opt.label}</span>
                      {opt.description && (
                        <span
                          className={cn(
                            "w-full truncate text-xs",
                            isSelected
                              ? "text-brand-fg opacity-90"
                              : "text-fg-muted"
                          )}
                        >
                          {opt.description}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
      {helperText && (
        <p id={helperId} className="text-xs text-fg-muted">
          {helperText}
        </p>
      )}
    </div>
  );
}
