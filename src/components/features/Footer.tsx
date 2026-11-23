import Link from "next/link";
import { copy } from "@/config/copy";
import { cn, focusRing } from "@/components/ui";

export function Footer() {
  return (
    <footer className="border-t-2 border-line bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
        <div className="space-y-1">
          <p className="font-display text-sm font-bold text-fg">
            {copy.footer.brandNote}
          </p>
          <p className="text-xs font-medium text-fg-muted">
            {copy.footer.tagline}
          </p>
        </div>

        <nav aria-label={copy.footer.navLabel}>
          <ul className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
            <li>
              <Link
                href="/#keunggulan"
                className={cn(
                  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-3 text-xs font-bold text-fg-muted transition-colors hover:text-brand sm:text-sm",
                  focusRing
                )}
              >
                {copy.nav.links.keunggulan}
              </Link>
            </li>
            <li>
              <Link
                href="/kalkulator"
                className={cn(
                  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-3 text-xs font-bold text-fg-muted transition-colors hover:text-brand sm:text-sm",
                  focusRing
                )}
              >
                {copy.nav.links.kalkulator}
              </Link>
            </li>
            <li>
              <Link
                href="/#faq"
                className={cn(
                  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-3 text-xs font-bold text-fg-muted transition-colors hover:text-brand sm:text-sm",
                  focusRing
                )}
              >
                {copy.nav.links.faq}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
