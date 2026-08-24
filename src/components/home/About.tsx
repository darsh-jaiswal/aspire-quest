import { Eyebrow, Section } from "@/components/ui/Section";
import { LAST_EDITION, LAST_EDITION_EVENTS } from "@/lib/content";

const DISTINCTIONS = [
  {
    title: "It is a hiring channel, not an event",
    body: "Partner companies onboard eight to ten weeks ahead, submit the problem statements their interviews are built around, and leave with candidates. Competitions elsewhere in the fest award prizes; this one awards offers.",
  },
  {
    title: "Candidates are screened before anyone meets them",
    body: "Applications are filtered on CGPA, branch and declared focus area. Partners see the candidates who applied to the roles they are actually hiring for, not a spreadsheet of everyone who signed up.",
  },
  {
    title: "The Placement Cell is in the loop",
    body: "Outcomes are recorded with the campus Placement Cell so an Aspire Quest offer sits alongside the formal placement record rather than beside it.",
  },
];

export function About() {
  return (
    <Section id="about" labelledBy="about-heading" rhythm="loose">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Eyebrow>What it is</Eyebrow>
          <h2
            id="about-heading"
            className="mt-5 max-w-[14ch] text-h1 font-semibold"
          >
            A recruitment drive inside a technical fest.
          </h2>
          <p className="mt-6 max-w-[46ch] text-lede text-slate">
            {LAST_EDITION.label} ran {LAST_EDITION.days} days across{" "}
            {LAST_EDITION.dateLabel} and drew{" "}
            <span data-figure className="font-semibold text-navy">
              {LAST_EDITION.participants}
            </span>{" "}
            participants across a dozen events. Aspire Quest is the track inside
            it that changes what a student does after graduation.
          </p>
        </div>

        <div className="lg:col-span-7">
          <ol className="border-t border-hairline">
            {DISTINCTIONS.map((item, index) => (
              <li
                key={item.title}
                className="grid grid-cols-[2.5rem_1fr] gap-x-5 border-b border-hairline py-8"
              >
                <span
                  data-figure
                  aria-hidden="true"
                  className="pt-1 text-sm font-semibold text-muted"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-h3 font-semibold">{item.title}</h3>
                  <p className="mt-2.5 max-w-[62ch] text-slate">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10">
            <Eyebrow>The rest of {LAST_EDITION.label}</Eyebrow>
            <ul className="mt-4 flex flex-wrap gap-x-2 gap-y-2">
              {LAST_EDITION_EVENTS.map((event) => (
                <li
                  key={event}
                  className="rounded border border-hairline px-2.5 py-1.5 text-xs text-muted"
                >
                  {event}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
