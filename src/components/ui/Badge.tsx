import type { StatusKategori } from "@/config/app.config";
import { copy } from "@/config/copy";
import { cn } from "./cn";

export interface BadgeProps {
  status: StatusKategori;
  /** Ganti label bawaan dari copy.status bila perlu. */
  label?: string;
  /** Tampilkan istilah Inggris (Safety/Target/Reach) di samping label. */
  showEnglish?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const STYLE: Record<StatusKategori, string> = {
  safe: "bg-status-safe-soft text-status-safe-fg border-line",
  target: "bg-status-target-soft text-status-target-fg border-line",
  reach: "bg-status-reach-soft text-status-reach-fg border-line",
};

/** Ikon berbeda per status: status tidak hanya dibedakan warna. */
function StatusIcon({ status }: { status: StatusKategori }) {
  const common = {
    "aria-hidden": true,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "size-3.5 shrink-0",
  };

  if (status === "safe") {
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="8" />
        <path d="M6.5 10.5l2.3 2.3 4.7-5" />
      </svg>
    );
  }
  if (status === "target") {
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="8" />
        <circle cx="10" cy="10" r="3.5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M10 2.5l8 14.5H2L10 2.5z" />
      <path d="M10 8v4" />
      <path d="M10 14.5v.01" />
    </svg>
  );
}

export function Badge({
  status,
  label,
  showEnglish = false,
  size = "md",
  className,
}: BadgeProps) {
  const text = label ?? copy.status[status].label;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border-2 font-display font-bold tracking-wide uppercase",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs",
        STYLE[status],
        className
      )}
    >
      <StatusIcon status={status} />
      <span>{text}</span>
      {showEnglish && (
        <span className="font-sans font-semibold normal-case">
          ({copy.status[status].english})
        </span>
      )}
    </span>
  );
}
