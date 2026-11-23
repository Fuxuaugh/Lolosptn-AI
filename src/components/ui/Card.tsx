import type { HTMLAttributes, ReactNode } from "react";
import { THEME, type CardStyle } from "@/config/theme";
import { cn } from "./cn";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  as?: "section" | "article" | "div";
  title?: ReactNode;
  titleAs?: "h2" | "h3" | "h4";
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
  titleAs: TitleTag = "h3",
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
        "min-w-0 rounded-card",
        !noPadding && "p-4 sm:p-card",
        VARIANT[variant],
        className
      )}
      {...rest}
    >
      {hasHeader && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {title && (
              <TitleTag className="font-display text-lg font-bold tracking-tight text-fg">
                {title}
              </TitleTag>
            )}
            {description && (
              <p className="mt-1 text-sm text-fg-muted">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </Tag>
  );
}
