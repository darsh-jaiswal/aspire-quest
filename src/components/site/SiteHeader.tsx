import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
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
          {/* Wrapped rather than hidden directly on the link: ButtonLink's
              own base class always carries an unconditional `inline-flex`,
              which fights `hidden` at equal CSS specificity — Tailwind
              resolves that by generation order, not by which one is more
              specific, so it isn't reliable. A plain wrapper has no
              competing display utility to fight. */}
          <div className="hidden sm:block">
            <ButtonLink href="/partners" variant="gradient-soft" className="px-4 py-2.5">
              For recruiters
            </ButtonLink>
          </div>
          <ButtonLink href="/register" variant="gradient" className="px-4 py-2.5">
            Register
          </ButtonLink>
          <HeaderAccount />
        </div>
      </Container>
    </header>
  );
}
