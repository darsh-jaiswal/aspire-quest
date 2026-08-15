import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/content";

const NAV = [
  { href: "/#about", label: "About" },
  { href: "/#proof", label: "Track record" },
  { href: "/#talent", label: "Talent pool" },
  { href: "/#process", label: "Process" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-surface/95 backdrop-blur-sm">
      <Container className="flex h-[4.5rem] items-center justify-between gap-6">
        <Link
          href="/"
          className="group flex flex-col leading-none"
          aria-label={`${SITE.name} — home`}
        >
          <span className="text-[1.0625rem] font-semibold tracking-tight text-navy">
            Aspire&nbsp;Quest
          </span>
          <span className="mt-1 text-[0.6875rem] tracking-wide text-muted">
            {SITE.institution}
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="relative py-2 text-sm text-slate transition-colors hover:text-navy after:absolute after:inset-x-0 after:-bottom-px after:h-px after:origin-left after:scale-x-0 after:bg-navy after:transition-transform after:duration-200 hover:after:scale-x-100 motion-reduce:after:transition-none"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/partners"
            className="hidden text-sm font-semibold text-navy underline-offset-4 hover:underline sm:inline"
          >
            For recruiters
          </Link>
          <ButtonLink href="/register" variant="accent" className="px-4 py-2.5">
            Register
          </ButtonLink>
        </div>
      </Container>
    </header>
  );
}
