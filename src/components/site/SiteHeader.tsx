import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/content";
import { HeaderAccount } from "./HeaderAccount";

/**
 * The header sits in normal document flow at the top of the page — it does
 * not follow the viewport as the page scrolls.
 */
export function SiteHeader() {
  return (
    <header className="bg-surface">
      <Container className="flex h-[4.5rem] items-center justify-between gap-6">
        <Link
          href="/"
          className="group flex items-center gap-3"
          aria-label={`${SITE.name} — home`}
        >
          <span className="flex flex-col leading-none">
            <span className="text-[1.0625rem] font-semibold tracking-tight text-navy">
              Aspire&nbsp;Quest
            </span>
            <span className="mt-1 text-[0.6875rem] tracking-wide text-muted">
              {SITE.institution}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/jobs"
            className="mr-1 hidden text-sm font-semibold text-slate underline-offset-4 transition-colors hover:text-navy hover:underline sm:block"
          >
            Openings
          </Link>
          {/* "For recruiters" renders inside HeaderAccount: it must hide for
              accounts that already hold a console, so it is Clerk-aware. */}
          <HeaderAccount />
        </div>
      </Container>
    </header>
  );
}
