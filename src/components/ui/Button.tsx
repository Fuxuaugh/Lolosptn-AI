import type { ButtonHTMLAttributes, ReactNode } from "react";
import { copy } from "@/config/copy";
import {
  cn,
  focusRing,
  tactileCardButton,
  tactileControlButton,
} from "./cn";

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
  primary: cn(
    "border-2 border-line bg-brand text-brand-fg hover:bg-brand-hover",
    tactileCardButton
  ),
  accent: cn(
    "border-2 border-line bg-accent-yellow text-accent-yellow-fg hover:bg-accent-yellow-hover",
    tactileControlButton
  ),
  secondary: cn(
    "border-2 border-line bg-surface text-fg hover:bg-surface-muted",
    tactileControlButton
  ),
  ghost:
    "border-2 border-transparent bg-transparent text-fg-muted transition-colors duration-150 hover:border-line hover:bg-surface hover:text-fg motion-reduce:transition-none",
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
        "disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none",
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
