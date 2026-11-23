import Link from "next/link";
import { copy } from "@/config/copy";
import { cn, focusRing, tactileControlButton } from "@/components/ui";

export interface NavbarProps {
  activeRoute?: "home" | "kalkulator";
}

export function Navbar({ activeRoute = "home" }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-line bg-surface">
      <a
        href="#main-content"
        className={cn(
          "sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-control focus:border-2 focus:border-line focus:bg-accent-yellow focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-accent-yellow-fg focus:shadow-card",
          focusRing
        )}
      >
        {copy.nav.skipToContent}
      </a>

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:h-[74px] sm:gap-4 sm:px-6 lg:px-8">
        {/* Brand + Badge Beta */}
        <Link
          href="/"
          aria-current={activeRoute === "home" ? "page" : undefined}
          className={cn(
            "group inline-flex min-h-11 min-w-0 items-center gap-2 rounded-control sm:gap-2.5",
            focusRing
          )}
        >
          <span
            aria-hidden="true"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-line bg-brand font-display text-base font-bold text-brand-fg shadow-pill transition-transform duration-150 group-hover:-rotate-6 motion-reduce:transform-none motion-reduce:transition-none sm:size-9 sm:text-lg"
          >
            {copy.nav.brandInitial}
          </span>
          <span className="truncate font-display text-base font-bold tracking-tight text-fg sm:text-xl">
            {copy.hero.brand}
          </span>
          <span className="shrink-0 rounded-md border-2 border-line bg-accent-yellow px-1.5 py-0.5 font-display text-[10px] leading-none font-bold tracking-wider text-accent-yellow-fg shadow-pill sm:px-2 sm:text-[11px]">
            {copy.nav.betaBadge}
          </span>
        </Link>

        {/* Links + CTA */}
        <nav
          aria-label={copy.nav.ariaLabel}
          className="flex shrink-0 items-center gap-2 sm:gap-4 lg:gap-6"
        >
          <Link
            href="/#keunggulan"
            className={cn(
              "hidden min-h-11 min-w-11 items-center justify-center rounded-lg px-3 text-sm font-semibold text-fg transition-colors hover:text-brand md:inline-flex",
              focusRing
            )}
          >
            {copy.nav.links.keunggulan}
          </Link>
          <Link
            href="/kalkulator"
            aria-current={activeRoute === "kalkulator" ? "page" : undefined}
            className={cn(
              "hidden min-h-11 min-w-11 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors hover:text-brand md:inline-flex",
              activeRoute === "kalkulator"
                ? "font-bold text-brand underline decoration-2 underline-offset-4"
                : "text-fg",
              focusRing
            )}
          >
            {copy.nav.links.kalkulator}
          </Link>
          <Link
            href="/#faq"
            className={cn(
              "hidden min-h-11 min-w-11 items-center justify-center rounded-lg px-3 text-sm font-semibold text-fg transition-colors hover:text-brand md:inline-flex",
              focusRing
            )}
          >
            {copy.nav.links.faq}
          </Link>

          <Link
            href="/kalkulator"
            aria-current={activeRoute === "kalkulator" ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center justify-center rounded-control border-2 border-line bg-brand px-3.5 text-xs font-bold whitespace-nowrap text-brand-fg hover:bg-brand-hover sm:px-4 sm:text-sm",
              tactileControlButton,
              focusRing
            )}
          >
            {copy.nav.cta}
          </Link>
        </nav>
      </div>
    </header>
  );
}
