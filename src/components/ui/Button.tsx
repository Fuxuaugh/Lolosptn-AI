import type { ButtonHTMLAttributes, ReactNode } from "react";
import { copy } from "@/config/copy";
import { cn, focusRing } from "./cn";

export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "border-2 border-line bg-brand text-brand-fg shadow-card hover:bg-brand-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
  accent:
    "border-2 border-line bg-accent-yellow text-accent-yellow-fg shadow-control hover:bg-accent-yellow-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
  secondary:
    "border-2 border-line bg-surface text-fg shadow-control hover:bg-surface-muted active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
  ghost:
    "border-2 border-transparent bg-transparent text-fg-muted hover:border-line hover:bg-surface hover:text-fg",
};

const SIZE: Record<ButtonSize, string> = {
  // min-h-11 = 44px: target sentuh minimal
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-13 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  leadingIcon,
  trailingIcon,
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
        "inline-flex items-center justify-center gap-2 rounded-control font-bold",
        "transition-all motion-reduce:transform-none motion-reduce:transition-none",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none",
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
      {!isLoading && trailingIcon}
      {isLoading && <span className="sr-only">{copy.common.loading}</span>}
    </button>
  );
}
