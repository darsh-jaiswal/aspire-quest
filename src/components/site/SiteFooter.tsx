import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { DitherGradient } from "@/components/ui/dither-gradient";
import { CONTACT, EDITION, SITE } from "@/lib/content";

const COLUMNS = [
  {
    heading: "Take part",
    links: [
      { href: "/register", label: "Student registration" },
      { href: "/partners", label: "Become a partner" },
      { href: "/alumni", label: "Refer through alumni" },
    ],
  },
  {
    heading: "The event",
    links: [
      { href: "/#about", label: "What Aspire Quest is" },
      { href: "/#proof", label: "Track record" },
      { href: "/#talent", label: "Talent pool" },
      { href: "/#process", label: "How it runs" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
];

/**
 * Ink-ground footer, laid out as a ruled grid rather than plain columns: the
 * hairlines run edge to edge so the cells read as a single lattice.
 *
 * The dithered band is the closing gesture — it dissolves the footer's top
 * edge into the page above instead of ending it on a hard rule.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink text-paper [--color-focus:var(--color-paper)]">
      {/* The dissolve. Sits above the grid and bleeds full width. */}
      <div aria-hidden="true" className="h-28 w-full sm:h-36">
        <DitherGradient
          direction="up"
          pixelSize={3}
          speed={1}
          colors={["#f7f7f4", "#bcbcb6", "#6e6e69"]}
        />
      </div>

      <Container className="pb-14">
        <div className="grid border-t border-paper/15 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="border-b border-paper/15 py-8 md:border-b-0 md:border-r md:pr-8">
            <p className="text-[1.0625rem] font-semibold tracking-tight text-paper">
              Aspire&nbsp;Quest
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-paper/55">
              The industry and careers track of {SITE.parentEvent}, the annual
              technical fest of {SITE.institution}.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded border border-paper/25 px-2.5 py-1.5 text-xs text-paper/75">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-paper"
              />
              {EDITION.label} · {EDITION.dateLabel}
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav
              key={column.heading}
              aria-label={column.heading}
              className="border-b border-paper/15 py-8 md:border-b-0 md:border-r md:px-8"
            >
              <h2 className="text-eyebrow font-semibold uppercase text-paper/45">
                {column.heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-paper/70 underline-offset-4 transition-colors hover:text-paper hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="py-8 md:pl-8">
            <h2 className="text-eyebrow font-semibold uppercase text-paper/45">
              Campus
            </h2>
            <address className="mt-4 space-y-0.5 text-sm not-italic leading-relaxed text-paper/70">
              <p>{CONTACT.address.line1}</p>
              <p>{CONTACT.address.line2}</p>
              <p>{CONTACT.address.line3}</p>
              <p>{CONTACT.address.line4}</p>
            </address>
            <div className="mt-4 space-y-1 text-sm">
              <p>
                <a
                  href={`mailto:${CONTACT.campusEmail}`}
                  className="text-paper/70 underline-offset-4 hover:text-paper hover:underline"
                >
                  {CONTACT.campusEmail}
                </a>
              </p>
              <p className="tabular">
                <a
                  href={`tel:${CONTACT.campusPhone.replace(/\s/g, "")}`}
                  className="text-paper/70 underline-offset-4 hover:text-paper hover:underline"
                >
                  {CONTACT.campusPhone}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-paper/15 pt-6 text-xs text-paper/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.institutionFull}
          </p>
          <p>
            Student data is handled under the DPDP Act — see the consent notice
            on the registration form.
          </p>
        </div>
      </Container>
    </footer>
  );
}
