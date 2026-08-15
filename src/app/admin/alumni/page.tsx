import Link from "next/link";
import { EmptyState, PageHeading, Pill } from "@/components/admin/Shell";
import { listAlumniReferrals } from "@/db/queries/companies";
import { requireAdmin } from "@/lib/auth";
import { PromoteButton } from "./PromoteButton";

export const metadata = { title: "Alumni" };
export const dynamic = "force-dynamic";

export default async function AlumniPage() {
  await requireAdmin();
  const referrals = await listAlumniReferrals();

  const pending = referrals.filter((r) => !r.promotedCompanyId);

  return (
    <>
      <PageHeading
        title="Alumni referrals"
        count={referrals.length}
        description="A named referral converts far better than cold outreach. Promoting one creates a company lead carrying the referrer's context."
      />

      {referrals.length === 0 ? (
        <EmptyState
          title="No referrals yet"
          body="Referrals arrive through the public alumni form. Sharing that link in alumni groups is the cheapest way to fill the corporate pipeline."
          action={
            <Link
              href="/alumni"
              className="rounded border border-hairline-strong px-4 py-2 text-sm font-semibold text-navy transition-colors hover:border-navy"
            >
              View the public form
            </Link>
          }
        />
      ) : (
        <>
          {pending.length > 0 ? (
            <p className="mb-5 rounded border border-amber/40 bg-amber-wash px-4 py-2.5 text-sm text-slate">
              <span data-figure className="font-semibold text-navy">
                {pending.length}
              </span>{" "}
              referral{pending.length === 1 ? "" : "s"} not yet promoted to a
              lead.
            </p>
          ) : null}

          <div className="overflow-x-auto rounded border border-hairline">
            <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
              <caption className="sr-only">Alumni referrals</caption>
              <thead>
                <tr className="border-b border-hairline-strong bg-raised">
                  {["Company", "Referred by", "Role", "Hiring", "State", ""].map(
                    (heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-4 py-2.5 text-eyebrow font-semibold uppercase text-muted"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr
                    key={referral.id}
                    className="border-b border-hairline align-top transition-colors last:border-0 hover:bg-raised"
                  >
                    <td className="px-4 py-3">
                      <span className="font-semibold text-navy">
                        {referral.company ?? "—"}
                      </span>
                      {referral.notes ? (
                        <span className="mt-1 block max-w-[34ch] text-xs leading-relaxed text-muted">
                          {referral.notes}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate">
                      {referral.alumName}
                      {referral.batch ? (
                        <span className="block text-xs tabular text-muted">
                          Batch {referral.batch}
                          {referral.branch ? ` · ${referral.branch}` : ""}
                        </span>
                      ) : null}
                      {referral.email ? (
                        <a
                          href={`mailto:${referral.email}`}
                          className="mt-1 block text-xs text-muted underline-offset-4 hover:text-navy hover:underline"
                        >
                          {referral.email}
                        </a>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate">
                      {referral.role ?? "—"}
                      {referral.linkedin ? (
                        <a
                          href={
                            referral.linkedin.startsWith("http")
                              ? referral.linkedin
                              : `https://${referral.linkedin}`
                          }
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="mt-1 block text-xs text-muted underline-offset-4 hover:text-navy hover:underline"
                        >
                          LinkedIn
                        </a>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {referral.hiringInterest ? (
                        <Pill tone="active">Yes</Pill>
                      ) : (
                        <Pill tone="muted">Unknown</Pill>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {referral.promotedCompanyId ? (
                        <Link href={`/admin/companies/${referral.promotedCompanyId}`}>
                          <Pill tone="positive">In pipeline</Pill>
                        </Link>
                      ) : (
                        <Pill tone="neutral">New</Pill>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {referral.promotedCompanyId ? null : (
                        <PromoteButton
                          referralId={referral.id}
                          company={referral.company ?? referral.alumName}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
