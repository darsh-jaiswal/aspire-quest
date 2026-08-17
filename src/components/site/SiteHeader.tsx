import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/content";

/**
 * The header is transparent and fixed, so it inherits whatever sits behind
 * it. That makes the tone load-bearing rather than cosmetic: the home page
 * floats it over the ink masthead, every other page over light surface. A
 * single fixed colour would be invisible on one of the two.
 */
export function SiteHeader({ onDark = false }: { onDark?: boolean }) {
  const wordmarkColor = onDark ? "text-paper" : "text-navy";
  const captionColor = onDark ? "text-paper/60" : "text-muted";

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-transparent">
      <Container className="flex h-[4.5rem] items-center justify-between gap-6">
        <Link
          href="/"
          className="group flex items-center gap-3"
          aria-label={`${SITE.name} — home`}
        >
          <span className="flex flex-col leading-none">
            <span
              className={`text-[1.0625rem] font-semibold tracking-tight ${wordmarkColor}`}
            >
              Aspire&nbsp;Quest
            </span>
            <span className={`mt-1 text-[0.6875rem] tracking-wide ${captionColor}`}>
              {SITE.institution}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ButtonLink
            href="/partners"
            variant="gradient-soft"
            className="hidden px-4 py-2.5 sm:inline-flex"
          >
            For recruiters
          </ButtonLink>
          <ButtonLink
            href="/register"
            variant={onDark ? "gradient-invert" : "gradient"}
            className="px-4 py-2.5"
          >
            Register
          </ButtonLink>
        </div>
      </Container>
    </header>
  );
}
