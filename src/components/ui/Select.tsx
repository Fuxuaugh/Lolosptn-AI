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

  const safeActiveIndex =
    filtered.length > 0 ? Math.min(activeIndex, filtered.length - 1) : -1;
  const activeOptionId =
    open && safeActiveIndex >= 0
      ? `${triggerId}-option-${safeActiveIndex}`
      : undefined;

  useEffect(() => {
    if (!open) return;

    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
        setActiveIndex(0);
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

  useEffect(() => {
    if (!open || !activeOptionId) return;
    const activeEl = document.getElementById(activeOptionId);
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [open, activeOptionId]);

  function openMenu(initialIndex?: number) {
    if (disabled) return;
    setQuery("");
    if (typeof initialIndex === "number") {
      setActiveIndex(initialIndex);
    } else {
      const selectedIdx = options.findIndex((o) => o.value === value);
      setActiveIndex(selectedIdx >= 0 ? selectedIdx : 0);
    }
    setOpen(true);
  }

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

  function handleTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        openMenu();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        const selectedIdx = options.findIndex((o) => o.value === value);
        openMenu(selectedIdx >= 0 ? selectedIdx : Math.max(options.length - 1, 0));
      }
    }
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu(true);
    } else if (e.key === "Tab") {
      closeMenu(false);
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
      const target =
        safeActiveIndex >= 0 ? filtered[safeActiveIndex] : undefined;
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
    <div
      ref={containerRef}
      className={cn("relative flex min-w-0 flex-col gap-1.5", className)}
    >
      <label
        htmlFor={triggerId}
        className="text-xs font-bold tracking-wide text-fg uppercase"
      >
        <span>{label}</span>
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-danger">
            *
          </span>
        )}
      </label>

      <div className="relative flex min-w-0 items-center gap-1.5">
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          role="combobox"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open && filtered.length > 0 ? listboxId : undefined}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          onKeyDown={handleTriggerKeyDown}
          onClick={() => {
            if (disabled) return;
            if (open) {
              closeMenu(false);
            } else {
              openMenu();
            }
          }}
          className={cn(
            "flex min-h-12 min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 rounded-control border-2 bg-surface px-3.5 text-left text-sm font-semibold",
            "transition-colors motion-reduce:transition-none",
            "disabled:cursor-not-allowed disabled:border-fg-subtle disabled:bg-surface-muted disabled:text-fg-subtle",
            error ? "border-danger" : "border-line",
            focusRing
          )}
        >
          <span
            className={cn(
              "min-w-0 truncate",
              selectedOption && !disabled
                ? "text-fg"
                : "font-normal text-fg-subtle"
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "size-4 shrink-0 transition-transform motion-reduce:transition-none",
              disabled ? "text-fg-subtle" : "text-fg",
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
            onClick={() => {
              onChange("");
              closeMenu(false);
              triggerRef.current?.focus();
            }}
            className={cn(
              "inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-control border-2 border-line bg-surface text-fg hover:bg-surface-muted",
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
              className="size-4"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full right-0 left-0 z-40 mt-1.5 max-w-full overflow-hidden rounded-control border-2 border-line bg-surface shadow-popover">
          <div className="border-b-2 border-line bg-surface-warm p-2">
            <input
              ref={searchRef}
              type="search"
              role="combobox"
              aria-expanded={open}
              aria-controls={filtered.length > 0 ? listboxId : undefined}
              aria-autocomplete="list"
              aria-activedescendant={activeOptionId}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className={cn(
                "min-h-11 w-full rounded-lg border-2 border-line bg-surface px-3 text-base font-medium text-fg placeholder:text-fg-subtle sm:text-sm",
                focusRing
              )}
            />
          </div>

          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {copy.common.resultCount(filtered.length)}
          </div>

          {filtered.length === 0 ? (
            <p
              role="status"
              className="px-3 py-3 text-center text-sm text-fg-muted"
            >
              {noResultsText}
            </p>
          ) : (
            <ul
              id={listboxId}
              role="listbox"
              aria-label={label}
              className="max-h-60 overflow-y-auto overscroll-contain p-1.5"
            >
              {filtered.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isActive = idx === safeActiveIndex;
                const optionId = `${triggerId}-option-${idx}`;
                return (
                  <li
                    key={opt.value}
                    id={optionId}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => selectValue(opt.value)}
                    className={cn(
                      "flex min-h-11 w-full cursor-pointer flex-col items-start justify-center rounded-lg px-3 py-2 text-left text-sm",
                      "transition-colors motion-reduce:transition-none",
                      isSelected && isActive
                        ? "bg-brand font-bold text-brand-fg ring-2 ring-line"
                        : isSelected
                          ? "bg-brand font-bold text-brand-fg"
                          : isActive
                            ? "bg-surface-muted font-medium text-fg"
                            : "font-medium text-fg hover:bg-surface-muted"
                    )}
                  >
                    <span className="w-full leading-snug break-words">
                      {opt.label}
                    </span>
                    {opt.description && (
                      <span
                        className={cn(
                          "w-full text-xs leading-snug break-words",
                          isSelected ? "text-brand-fg" : "text-fg-muted"
                        )}
                      >
                        {opt.description}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs font-bold text-danger">
          {error}
        </p>
      )}
      {helperText && (
        <p id={helperId} className="text-xs font-medium text-fg-muted">
          {helperText}
        </p>
      )}
    </div>
  );
}
