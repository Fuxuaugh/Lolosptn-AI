import { copy } from "@/config/copy";

export function Footer() {
  return (
    <footer className="border-t-2 border-line bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-xs sm:flex-row sm:px-6 sm:text-left lg:px-8">
        <p className="font-display font-bold text-fg-muted">
          {copy.footer.brandNote}
        </p>
        <p className="font-medium text-fg-subtle">{copy.footer.tagline}</p>
      </div>
    </footer>
  );
}
