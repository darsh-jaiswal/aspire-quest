import Link from "next/link";
import { EmptyState, PageHeading, Pill } from "@/components/admin/Shell";
import { listReleasedBundlesForCompanies } from "@/db/queries/portal";
import { requireRecruiter } from "@/lib/auth";
import { FOCUS_AREAS } from "@/lib/content";

/**
 * Candidate sets released to this recruiter's company.
 *
 * Nothing here is keyed by anything the client sent — the company scope comes
 * from `recruiter_memberships` via the actor, so there is no id to tamper with.
 */

export const dynamic = "force-dynamic";

const FOCUS_LABEL = Object.fromEntries(FOCUS_AREAS.map((a) => [a.code, a.name]));

const DATE_FORMAT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function PortalIndexPage() {
  const actor = await requireRecruiter();
  const bundles = await listReleasedBundlesForCompanies(actor.companyIds);

  const totalCandidates = bundles.reduce((sum, b) => sum + b.size, 0);

  return (
    <>
      <PageHeading
        title="Candidate sets"
        count={bundles.length}
        description={
          bundles.length > 0
            ? `${totalCandidates.toLocaleString("en-IN")} candidates shortlisted for you by the Aspire Quest team. Open a set to review resumes and mark the people you want to meet.`
            : undefined
        }
      />

      {actor.companyIds.length === 0 ? (
        <EmptyState
          title="Your account is not linked to a company yet"
          body="An Aspire Quest organiser needs to link your account to your company before candidate sets can appear here. If you were expecting access, reply to the email that invited you."
        />
      ) : bundles.length === 0 ? (
        <EmptyState
          title="No candidate sets yet"
          body="The Aspire Quest team is still screening candidates against your requirements. You will receive an email when the first set is ready — nothing is shared with you until it is deliberately released."
        />
      ) : (
        <ul className="border-t border-hairline-strong">
          {bundles.map((bundle) => {
            const isFullyReviewed =
              bundle.size > 0 && bundle.reviewed === bundle.size;

            return (
              <li key={bundle.id} className="border-b border-hairline">
                <Link
                  href={`/portal/bundles/${bundle.id}`}
                  className="group flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5 transition-colors hover:bg-raised"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-3 font-semibold text-navy underline-offset-4 group-hover:underline">
                      {bundle.title}
                      {isFullyReviewed ? (
                        <Pill tone="positive">Reviewed</Pill>
                      ) : bundle.reviewed > 0 ? (
                        <Pill tone="active">In progress</Pill>
                      ) : (
                        <Pill tone="muted">Not started</Pill>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {FOCUS_LABEL[bundle.focusArea] ?? bundle.focusArea}
                      {bundle.releasedAt
                        ? ` · shared ${DATE_FORMAT.format(bundle.releasedAt)}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-6">
                    <p className="text-sm text-muted">
                      <span
                        data-figure
                        className="text-h3 font-semibold text-navy"
                      >
                        {bundle.size}
                      </span>{" "}
                      candidate{bundle.size === 1 ? "" : "s"}
                    </p>
                    <p className="text-sm text-muted">
                      <span data-figure className="font-semibold text-slate">
                        {bundle.reviewed}
                      </span>{" "}
                      reviewed
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-10 max-w-[68ch] text-xs text-muted">
        Candidate details and resumes are shared under the students&rsquo;
        explicit consent for Aspire Quest recruitment. Every resume you open is
        logged. Please do not redistribute them outside your hiring team.
      </p>
    </>
  );
}
