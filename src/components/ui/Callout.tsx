import type { ReactNode } from "react";
import { cn } from "./cn";

export type CalloutTone = "warning" | "info";

export interface CalloutProps {
  tone?: CalloutTone;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}

const TONE: Record<CalloutTone, string> = {
  warning: "border-callout-border bg-callout-bg text-callout-fg shadow-card",
  info: "border-line bg-ai-header text-fg shadow-control",
};

function CalloutIcon({ tone }: { tone: CalloutTone }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 size-5 shrink-0"
    >
      {tone === "warning" ? (
        <>
          <path d="M10 2.5l8 14.5H2L10 2.5z" />
          <path d="M10 8v4" />
          <path d="M10 14.5v.01" />
        </>
      ) : (
        <>
          <circle cx="10" cy="10" r="8" />
          <path d="M10 9v5" />
          <path d="M10 6v.01" />
        </>
      )}
    </svg>
  );
}

export function Callout({
  tone = "warning",
  title,
  children,
  className,
}: CalloutProps) {
  return (
    <aside
      role="note"
      className={cn(
        "flex gap-3 rounded-card border-2 p-card text-sm",
        TONE[tone],
        className
      )}
    >
      <CalloutIcon tone={tone} />
      <div className="min-w-0 space-y-1 leading-relaxed">
        {title && (
          <p className="font-display text-sm font-bold tracking-wide">{title}</p>
        )}
        <div>{children}</div>
      </div>
    </aside>
  );
}
