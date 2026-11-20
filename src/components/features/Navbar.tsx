import Link from "next/link";
import { copy } from "@/config/copy";
import { cn, focusRing, tactileControlButton } from "@/components/ui";

export interface NavbarProps {
  activeRoute?: "home" | "kalkulator";
}

export function Navbar({ activeRoute = "home" }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[74px] sm:px-6 lg:px-8">
        {/* Brand + Badge Beta */}
        <Link
          href="/"
          className={cn(
            "group inline-flex min-h-11 items-center gap-2.5 rounded-control",
            focusRing
          )}
        >
          <span
            aria-hidden="true"
            className="inline-flex size-8 items-center justify-center rounded-lg border-2 border-line bg-brand font-display text-base font-bold text-brand-fg shadow-pill transition-transform duration-150 group-hover:-rotate-6 motion-reduce:transform-none motion-reduce:transition-none sm:size-9 sm:text-lg"
          >
            {copy.nav.brandInitial}
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-fg sm:text-xl">
            {copy.hero.brand}
          </span>
          <span className="rounded-md border-2 border-line bg-accent-yellow px-2 py-0.5 font-display text-[10px] font-bold tracking-wider text-accent-yellow-fg shadow-pill sm:text-[11px]">
            {copy.nav.betaBadge}
          </span>
        </Link>

        {/* Links + CTA */}
        <nav
          aria-label={copy.hero.brand}
          className="flex items-center gap-2 sm:gap-6"
        >
          <Link
            href="/#keunggulan"
            className={cn(
              "hidden min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-fg transition-colors hover:text-brand md:inline-flex",
              focusRing
            )}
          >
            {copy.nav.links.keunggulan}
          </Link>
          <Link
            href="/kalkulator"
            aria-current={activeRoute === "kalkulator" ? "page" : undefined}
            className={cn(
              "hidden min-h-11 items-center rounded-lg px-2 text-sm font-semibold transition-colors hover:text-brand md:inline-flex",
              activeRoute === "kalkulator" ? "font-bold text-brand" : "text-fg",
              focusRing
            )}
          >
            {copy.nav.links.kalkulator}
          </Link>
          <Link
            href="/#faq"
            className={cn(
              "hidden min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-fg transition-colors hover:text-brand md:inline-flex",
              focusRing
            )}
          >
            {copy.nav.links.faq}
          </Link>

          <Link
            href="/kalkulator"
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-control border-2 border-line bg-brand px-3.5 text-xs font-bold text-brand-fg hover:bg-brand-hover sm:px-4 sm:text-sm",
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
