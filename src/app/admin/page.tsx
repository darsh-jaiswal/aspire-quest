import Link from "next/link";
import { PageHeading, StatBlock } from "@/components/admin/Shell";
import {
  companyStatusCounts,
  countPendingReferrals,
} from "@/db/queries/companies";
import { studentStatusCounts } from "@/db/queries/students";
import { requireAdmin } from "@/lib/auth";
import { PHASES } from "@/lib/content";
import { COMPANY_STATUSES, COMPANY_STATUS_LABEL } from "@/lib/pipeline";

export const metadata = { title: "Overview" };

/** Console pages are per-request by definition — never cache them. */
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();

  const [students, companies, pendingReferrals] = await Promise.all([
    studentStatusCounts(),
    companyStatusCounts(),
    countPendingReferrals(),
  ]);

  const totalStudents = Object.values(students).reduce((a, b) => a + b, 0);
  const totalCompanies = Object.values(companies).reduce((a, b) => a + b, 0);
  const committed = companies.committed + companies.onboarded;

  return (
    <>
      <PageHeading
        title="Overview"
        description="Where the two pipelines stand. Corporate onboarding closes before student screening opens — if the committed count is low, that is the number to work on first."
      />

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock
          label="Registrations"
          value={totalStudents}
          note={`${students.shortlisted} shortlisted`}
        />
        <StatBlock
          label="Companies in pipeline"
          value={totalCompanies}
          note={`${committed} committed or onboarded`}
        />
        <StatBlock
          label="Selected"
          value={students.selected}
          note="Offers made"
        />
        <StatBlock
          label="Referrals to action"
          value={pendingReferrals}
          note="Not yet promoted to a lead"
        />
      </div>

      <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <section aria-labelledby="student-pipeline">
          <h2
            id="student-pipeline"
            className="text-eyebrow font-semibold uppercase text-muted"
          >
            Student pipeline
          </h2>
          <dl className="mt-4 border-t border-hairline-strong">
            {(
              [
                ["registered", "Registered"],
                ["screened", "Screened"],
                ["shortlisted", "Shortlisted"],
                ["interviewed", "Interviewed"],
                ["selected", "Selected"],
                ["rejected", "Not progressed"],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                className="flex items-baseline justify-between gap-4 border-b border-hairline py-3"
              >
                <dt className="text-sm text-slate">{label}</dt>
                <dd
                  data-figure
                  className="text-sm font-semibold tabular text-navy"
                >
                  {students[key]}
                </dd>
              </div>
            ))}
          </dl>
          <Link
            href="/admin/students"
            className="mt-5 inline-block text-sm font-semibold text-navy underline-offset-4 hover:underline"
          >
            Screen candidates →
          </Link>
        </section>

        <section aria-labelledby="company-pipeline">
          <h2
            id="company-pipeline"
            className="text-eyebrow font-semibold uppercase text-muted"
          >
            Corporate pipeline
          </h2>
          <dl className="mt-4 border-t border-hairline-strong">
            {COMPANY_STATUSES.map((status) => (
              <div
                key={status}
                className="flex items-baseline justify-between gap-4 border-b border-hairline py-3"
              >
                <dt className="text-sm text-slate">
                  {COMPANY_STATUS_LABEL[status]}
                </dt>
                <dd data-figure className="text-sm font-semibold text-navy">
                  {companies[status]}
                </dd>
              </div>
            ))}
          </dl>
          <Link
            href="/admin/companies"
            className="mt-5 inline-block text-sm font-semibold text-navy underline-offset-4 hover:underline"
          >
            Work the pipeline →
          </Link>
        </section>
      </div>

      <section aria-labelledby="phases" className="mt-16">
        <h2
          id="phases"
          className="text-eyebrow font-semibold uppercase text-muted"
        >
          Playbook phases
        </h2>
        <ol className="mt-4 grid gap-px overflow-hidden rounded border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
          {PHASES.map((phase) => (
            <li key={phase.number} className="bg-surface p-5">
              <p
                data-figure
                className="text-sm font-semibold text-amber"
              >
                {phase.window}
              </p>
              <p className="mt-2 font-semibold text-navy">{phase.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                {phase.summary}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
