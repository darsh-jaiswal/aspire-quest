import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, PageHeading, Pill } from "@/components/admin/Shell";
import { getBundleMembers } from "@/db/queries/bundles";
import { getReleasedBundleForCompanies } from "@/db/queries/portal";
import { recordBulkAudit } from "@/lib/audit";
import { requireRecruiter } from "@/lib/auth";
import { FOCUS_AREAS } from "@/lib/content";
import { CandidateRow } from "./CandidateRow";

/**
 * One candidate set.
 *
 * `getReleasedBundleForCompanies` carries the company filter into the query, so
 * an id belonging to another company returns null and falls through to
 * `notFound()` — the same response as an id that does not exist. A recruiter
 * cannot use this route to discover that a bundle exists elsewhere.
 *
 * Opening the set writes one audit row, not one per candidate: this is a single
 * act of access by a single person.
 */

export const dynamic = "force-dynamic";

const FOCUS_LABEL = Object.fromEntries(FOCUS_AREAS.map((a) => [a.code, a.name]));

const DATE_FORMAT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function PortalBundlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireRecruiter();
  const { id } = await params;

  const bundleId = Number(id);
  if (!Number.isInteger(bundleId) || bundleId <= 0) notFound();

  const bundle = await getReleasedBundleForCompanies(
    bundleId,
    actor.companyIds,
  );
  if (!bundle) notFound();

  const members = await getBundleMembers(bundleId);

  if (members.length > 0) {
    await recordBulkAudit(
      actor,
      "view_bundle",
      members.length,
      `Portal · bundle #${bundleId} · ${bundle.companyName}`,
    );
  }

  const interestedCount = members.filter((m) => m.interested === true).length;

  return (
    <>
      <Link
        href="/portal"
        className="mb-6 inline-block text-sm text-muted underline-offset-4 hover:text-navy hover:underline"
      >
        ← All candidate sets
      </Link>

      <PageHeading
        title={bundle.title}
        count={members.length}
        description={`${FOCUS_LABEL[bundle.focusArea] ?? bundle.focusArea}${
          bundle.releasedAt
            ? ` · shared with you on ${DATE_FORMAT.format(bundle.releasedAt)}`
            : ""
        }`}
        actions={
          interestedCount > 0 ? (
            <Pill tone="positive">
              {interestedCount} marked interested
            </Pill>
          ) : null
        }
      />

      {members.length === 0 ? (
        <EmptyState
          title="This set is empty"
          body="The organisers have not added candidates to this set yet. It will fill in without you needing to do anything."
        />
      ) : (
        <>
          <p className="mb-6 max-w-[68ch] text-sm text-slate">
            Mark the candidates you want to interview. The Aspire Quest team
            sees these marks and arranges the interview slots — students are not
            notified by this screen, and never see your notes.
          </p>

          <ul className="border-t border-hairline-strong">
            {members.map((member) => (
              <CandidateRow
                key={member.studentId}
                bundleId={bundleId}
                studentId={member.studentId}
                refCode={member.refCode}
                fullName={member.fullName}
                email={member.email}
                branch={member.branch}
                programme={member.programme}
                year={member.year}
                cgpa={member.cgpa}
                skills={member.skills}
                hasResume={Boolean(member.resumeBlobKey)}
                interested={member.interested}
                recruiterNote={member.recruiterNote}
              />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
