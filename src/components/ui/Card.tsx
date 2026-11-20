import type { HTMLAttributes, ReactNode } from "react";
import { THEME, type CardStyle } from "@/config/theme";
import { cn } from "./cn";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  as?: "section" | "article" | "div";
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  variant?: CardStyle;
  /** Jika true, padding diatur sendiri oleh konten anak (mis. kartu dengan header berwarna penuh). */
  noPadding?: boolean;
}

const VARIANT: Record<CardStyle, string> = {
  flat: "border-2 border-line bg-surface-warm shadow-control",
  elevated: "border-2 border-line bg-surface shadow-card",
  outlined: "border-2 border-line bg-surface",
};

export function Card({
  as: Tag = "section",
  title,
  description,
  actions,
  variant = THEME.cardStyle,
  noPadding = false,
  className,
  children,
  ...rest
}: CardProps) {
  const hasHeader = title || description || actions;

  return (
    <Tag
      className={cn(
        "rounded-card",
        !noPadding && "p-card",
        VARIANT[variant],
        className
      )}
      {...rest}
    >
      {hasHeader && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h3 className="font-display text-lg font-bold tracking-tight text-fg">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-sm text-fg-muted">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      {children}
    </Tag>
  );
}
