import { Container } from "@/components/ui/Container";
import { Eyebrow, Section } from "@/components/ui/Section";
import { PLACEMENTS, PLACEMENT_STATS, RECRUITERS } from "@/lib/content";

/**
 * The credibility section. Every number here is sourced — this is the part of
 * the page a recruiter reads before deciding whether to reply to an email.
 */
export function Proof() {
  return (
    <div id="proof">
      {/* Inverted band. The one place the page goes dark, so the outcomes land. */}
      <section
        aria-labelledby="outcomes-heading"
        className="bg-navy py-16 text-white md:py-20"
      >
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="text-eyebrow font-semibold uppercase text-white/55">
                Last edition
              </p>
              <h2
                id="outcomes-heading"
                className="mt-5 text-h2 font-semibold text-white"
              >
                Aspire Quest&nbsp;’26 ended in offers.
              </h2>
              <p className="mt-4 max-w-[42ch] text-white/70">
                Two third-year students were hired by Anantam Aerials and
                Robotics on a paid internship with a Pre-Placement Offer track.
              </p>
            </div>

            <ul className="grid gap-px overflow-hidden rounded border border-white/15 bg-white/15 sm:grid-cols-2 lg:col-span-8">
              {PLACEMENTS.map((placement) => (
                <li key={placement.name} className="bg-navy p-7">
                  <p className="text-h3 font-semibold text-white">
                    {placement.name}
                  </p>
                  <p className="mt-1.5 text-sm text-white/60">
                    {placement.programme} · {placement.year}
                  </p>

                  <dl className="mt-6 space-y-3 border-t border-white/15 pt-5 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-white/55">Company</dt>
                      <dd className="text-right font-semibold text-white">
                        {placement.company}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-white/55">Stipend</dt>
                      <dd data-figure className="font-semibold text-white">
                        {placement.stipend}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-white/55">PPO track</dt>
                      <dd className="font-semibold text-amber">
                        {placement.ppo ? "Eligible" : "—"}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* Placement data as a designed ruled table — never a card grid. */}
      <Section labelledBy="placements-heading" rhythm="tight">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Eyebrow>Campus placement record</Eyebrow>
            <h2
              id="placements-heading"
              className="mt-5 text-h2 font-semibold"
            >
              The pool these candidates come from.
            </h2>
            <p className="mt-4 max-w-[40ch] text-slate">
              Published placement outcomes for MPSTME Shirpur. Figures are
              annual packages in lakhs per annum.
            </p>
          </div>

          <div className="lg:col-span-8">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left">
                <caption className="sr-only">
                  Highest and average placement packages by programme and year,
                  in lakhs per annum
                </caption>
                <thead>
                  <tr className="border-y border-hairline-strong">
                    <th
                      scope="col"
                      className="py-3 pr-4 text-eyebrow font-semibold uppercase text-muted"
                    >
                      Programme
                    </th>
                    <th
                      scope="col"
                      className="py-3 pr-4 text-eyebrow font-semibold uppercase text-muted"
                    >
                      Year
                    </th>
                    <th
                      scope="col"
                      className="py-3 pr-4 text-right text-eyebrow font-semibold uppercase text-muted"
                    >
                      Highest
                    </th>
                    <th
                      scope="col"
                      className="py-3 text-right text-eyebrow font-semibold uppercase text-muted"
                    >
                      Average
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PLACEMENT_STATS.map((stat) => (
                    <tr
                      key={`${stat.programme}-${stat.year}`}
                      className="border-b border-hairline transition-colors hover:bg-raised"
                    >
                      <th
                        scope="row"
                        className="py-4 pr-4 font-semibold text-navy"
                      >
                        {stat.programme}
                      </th>
                      <td className="py-4 pr-4 text-slate">{stat.year}</td>
                      <td className="py-4 pr-4 text-right font-semibold text-navy">
                        {stat.highest.toFixed(2)}
                      </td>
                      <td className="py-4 text-right text-slate">
                        {stat.average.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10">
              <Eyebrow>Recruiters on campus</Eyebrow>
              <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                {RECRUITERS.map((recruiter) => (
                  <li
                    key={recruiter}
                    className="text-sm font-semibold tracking-tight text-slate"
                  >
                    {recruiter}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
