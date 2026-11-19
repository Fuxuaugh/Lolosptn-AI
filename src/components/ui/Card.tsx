import type { HTMLAttributes, ReactNode } from "react";
import { THEME, type CardStyle } from "@/config/theme";
import { cn } from "./cn";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  as?: "section" | "article" | "div";
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  variant?: CardStyle;
}

const VARIANT: Record<CardStyle, string> = {
  flat: "bg-surface-muted",
  elevated: "border border-line bg-surface shadow-card",
  outlined: "border border-line-strong bg-surface",
};

export function Card({
  as: Tag = "section",
  title,
  description,
  actions,
  variant = THEME.cardStyle,
  className,
  children,
  ...rest
}: CardProps) {
  const hasHeader = title || description || actions;

  return (
    <Tag className={cn("rounded-card p-card", VARIANT[variant], className)} {...rest}>
      {hasHeader && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h3 className="text-base font-semibold text-fg">{title}</h3>}
            {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      {children}
    </Tag>
  );
}
