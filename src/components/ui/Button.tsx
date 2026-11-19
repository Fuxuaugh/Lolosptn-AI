import type { ButtonHTMLAttributes, ReactNode } from "react";
import { copy } from "@/config/copy";
import { cn, focusRing } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leadingIcon?: ReactNode;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-fg hover:bg-brand-hover",
  secondary: "border border-line-strong bg-surface text-fg hover:bg-surface-muted",
  ghost: "bg-transparent text-brand hover:bg-surface-muted",
};

const SIZE: Record<ButtonSize, string> = {
  // min-h-11 = 44px: target sentuh minimal
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  leadingIcon,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-control font-semibold",
        "transition-colors motion-reduce:transition-none",
        "disabled:cursor-not-allowed disabled:opacity-60",
        focusRing,
        VARIANT[variant],
        SIZE[size],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="size-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
        />
      ) : (
        leadingIcon
      )}
      <span>{children}</span>
      {isLoading && <span className="sr-only">{copy.common.loading}</span>}
    </button>
  );
}
