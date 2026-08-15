import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, PageHeading, Pill } from "@/components/admin/Shell";
import { getBundle, getBundleMembers } from "@/db/queries/bundles";
import { recordBulkAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { FOCUS_AREAS } from "@/lib/content";
import { ReleaseControls, RemoveButton } from "./ReleaseControls";

export const dynamic = "force-dynamic";

const FOCUS_LABEL = Object.fromEntries(FOCUS_AREAS.map((a) => [a.code, a.name]));

export default async function BundleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireAdmin();
  const { id } = await params;

  const bundleId = Number(id);
  if (!Number.isInteger(bundleId) || bundleId <= 0) notFound();

  const bundle = await getBundle(bundleId);
  if (!bundle) notFound();

  const members = await getBundleMembers(bundleId);

  if (members.length > 0) {
    await recordBulkAudit(
      actor,
      "view_bundle",
      members.length,
      `Bundle #${bundleId} · ${bundle.companyName}`,
    );
  }

  return (
    <>
      <Link
        href="/admin/bundles"
        className="mb-6 inline-block text-sm text-muted underline-offset-4 hover:text-navy hover:underline"
      >
        ← Back to bundles
      </Link>

      <PageHeading
        title={bundle.title}
        count={members.length}
        description={`${bundle.companyName} · ${FOCUS_LABEL[bundle.focusArea] ?? bundle.focusArea}${
          bundle.cgpaThreshold ? ` · built at CGPA ${bundle.cgpaThreshold}` : ""
        }`}
        actions={
          bundle.releasedAt ? (
            <Pill tone="positive">Released</Pill>
          ) : (
            <Pill tone="muted">Draft</Pill>
          )
        }
      />

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-8">
          {members.length === 0 ? (
            <EmptyState
              title="No candidates in this bundle"
              body="Go to the screening view, filter to the candidates you want, select them, and add them to this bundle."
              action={
                <Link
                  href="/admin/students"
                  className="rounded border border-navy bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-hover"
                >
                  Screen candidates
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded border border-hairline">
              <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Candidates in {bundle.title}
                </caption>
                <thead>
                  <tr className="border-b border-hairline-strong bg-raised">
                    {["Ref", "Name", "Branch", "CGPA", "Interest", ""].map(
                      (heading) => (
                        <th
                          key={heading}
                          scope="col"
                          className={`px-4 py-2.5 text-eyebrow font-semibold uppercase text-muted ${
                            heading === "CGPA" ? "text-right" : ""
                          }`}
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.studentId}
                      className="border-b border-hairline transition-colors last:border-0 hover:bg-raised"
                    >
                      <td className="px-4 py-3 text-xs tabular text-muted">
                        {member.refCode}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/students/${member.studentId}`}
                          className="font-semibold text-navy underline-offset-4 hover:underline"
                        >
                          {member.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate">{member.branch}</td>
                      <td
                        data-figure
                        className="px-4 py-3 text-right font-semibold text-navy"
                      >
                        {member.cgpa}
                      </td>
                      <td className="px-4 py-3">
                        {member.interested === true ? (
                          <Pill tone="positive">Interested</Pill>
                        ) : member.interested === false ? (
                          <Pill tone="critical">Passed</Pill>
                        ) : (
                          <Pill tone="muted">Not reviewed</Pill>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <RemoveButton
                          bundleId={bundleId}
                          studentId={member.studentId}
                          studentName={member.fullName}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <ReleaseControls
            bundleId={bundleId}
            isReleased={Boolean(bundle.releasedAt)}
            companyName={bundle.companyName}
            size={members.length}
          />

          {members.some((m) => m.recruiterNote) ? (
            <>
              <h2 className="mt-10 text-eyebrow font-semibold uppercase text-muted">
                Recruiter notes
              </h2>
              <ul className="mt-4 border-t border-hairline-strong">
                {members
                  .filter((m) => m.recruiterNote)
                  .map((member) => (
                    <li
                      key={member.studentId}
                      className="border-b border-hairline py-3"
                    >
                      <p className="text-sm font-semibold text-navy">
                        {member.fullName}
                      </p>
                      <p className="mt-1 text-sm text-slate">
                        {member.recruiterNote}
                      </p>
                    </li>
                  ))}
              </ul>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
