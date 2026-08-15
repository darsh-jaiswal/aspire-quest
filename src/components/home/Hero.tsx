import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EDITION, LAST_EDITION, PLACEMENTS, SITE } from "@/lib/content";

/** Only figures that are sourced. No invented counts. */
const HERO_FACTS = [
  {
    figure: LAST_EDITION.participants.toLocaleString("en-IN"),
    label: "Participants at Ambiora '26",
    note: `${LAST_EDITION.dateLabel} · ${LAST_EDITION.days} days`,
  },
  {
    figure: "₹5,000",
    label: "Monthly stipend, last edition",
    note: "Anantam Aerials and Robotics, PPO-eligible",
  },
  {
    figure: String(PLACEMENTS.length),
    label: "Students placed through Aspire Quest '26",
    note: "Both third-year, B.Tech CS and CE",
  },
];

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="border-b border-hairline">
      <Container className="grid gap-14 py-20 md:py-28 lg:grid-cols-12 lg:gap-16 lg:py-32">
        <div className="lg:col-span-7">
          <p className="inline-flex items-center gap-2.5 rounded border border-hairline-strong bg-raised px-3 py-1.5 text-xs font-semibold tracking-wide text-navy">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-amber"
            />
            {EDITION.label}
            <span className="text-muted">·</span>
            <span className="font-normal text-slate">{EDITION.dateLabel}</span>
          </p>

          <h1
            id="hero-heading"
            className="mt-8 max-w-[16ch] text-display font-semibold text-navy"
          >
            The industry interviews here.
          </h1>

          <p className="mt-7 max-w-[52ch] text-lede text-slate">
            Aspire Quest is the careers track of {SITE.parentEvent}, the annual
            technical fest of {SITE.institution}. It is not a simulation and it
            is not a workshop — partner companies come to campus, interview our
            students, and make real internship offers with stipends and PPO
            tracks.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/register" variant="accent">
              Register as a student
            </ButtonLink>
            <ButtonLink href="/partners" variant="outline">
              Recruit from MPSTME
            </ButtonLink>
          </div>

          <p className="mt-5 text-sm text-muted">
            No account needed — registration takes one form and returns your
            reference code on screen.
          </p>
        </div>

        {/* Ruled fact column. Rules and alignment do the structural work here,
            not cards. */}
        <div className="lg:col-span-5 lg:pl-12">
          <dl className="border-t border-hairline">
            {HERO_FACTS.map((fact) => (
              <div
                key={fact.label}
                className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 border-b border-hairline py-6"
              >
                <dd
                  data-figure
                  className="text-h1 font-semibold tracking-tight text-navy"
                >
                  {fact.figure}
                </dd>
                <div>
                  <dt className="text-sm font-semibold text-slate">
                    {fact.label}
                  </dt>
                  <p className="mt-1 text-sm text-muted">{fact.note}</p>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
