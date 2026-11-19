import { cn } from "./cn";

export interface SkeletonProps {
  /** Atur ukuran lewat kelas Tailwind (mis. "h-6 w-1/2"). */
  className?: string;
  rounded?: "control" | "card" | "full";
}

const ROUNDED = {
  control: "rounded-control",
  card: "rounded-card",
  full: "rounded-full",
} as const;

export function Skeleton({ className, rounded = "control" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-4 w-full bg-surface-muted motion-safe:animate-pulse", ROUNDED[rounded], className)}
    />
  );
}
