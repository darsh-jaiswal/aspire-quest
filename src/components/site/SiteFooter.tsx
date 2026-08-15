import Link from "next/link";
import { Container } from "@/components/ui/Container";
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

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-hairline bg-raised">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <p className="text-[1.0625rem] font-semibold tracking-tight text-navy">
              Aspire&nbsp;Quest
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              The industry and careers track of {SITE.parentEvent}, the annual
              technical fest of {SITE.institution}.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded border border-hairline-strong bg-surface px-2.5 py-1.5 text-xs text-slate">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-amber"
              />
              {EDITION.label} · {EDITION.dateLabel}
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="text-eyebrow font-semibold uppercase text-muted">
                {column.heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate underline-offset-4 transition-colors hover:text-navy hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h2 className="text-eyebrow font-semibold uppercase text-muted">
              Campus
            </h2>
            <address className="mt-4 space-y-0.5 text-sm not-italic leading-relaxed text-slate">
              <p>{CONTACT.address.line1}</p>
              <p>{CONTACT.address.line2}</p>
              <p>{CONTACT.address.line3}</p>
              <p>{CONTACT.address.line4}</p>
            </address>
            <div className="mt-4 space-y-1 text-sm">
              <p>
                <a
                  href={`mailto:${CONTACT.campusEmail}`}
                  className="text-slate underline-offset-4 hover:text-navy hover:underline"
                >
                  {CONTACT.campusEmail}
                </a>
              </p>
              <p className="tabular">
                <a
                  href={`tel:${CONTACT.campusPhone.replace(/\s/g, "")}`}
                  className="text-slate underline-offset-4 hover:text-navy hover:underline"
                >
                  {CONTACT.campusPhone}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-hairline pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
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
