import Link from "next/link";
import { EmptyState, PageHeading, Pill } from "@/components/admin/Shell";
import { listBundles } from "@/db/queries/bundles";
import { listCompanies } from "@/db/queries/companies";
import { requireAdmin } from "@/lib/auth";
import { FOCUS_AREAS } from "@/lib/content";
import { CreateBundleForm } from "./CreateBundleForm";

export const metadata = { title: "Bundles" };
export const dynamic = "force-dynamic";

const FOCUS_LABEL = Object.fromEntries(FOCUS_AREAS.map((a) => [a.code, a.name]));

export default async function BundlesPage() {
  await requireAdmin();

  const [bundles, companies] = await Promise.all([
    listBundles(),
    listCompanies(),
  ]);

  return (
    <>
      <PageHeading
        title="Bundles"
        count={bundles.length}
        description="A bundle is the screened candidate set one company receives. Nothing is visible to a recruiter until the bundle is explicitly released."
      />

      <CreateBundleForm
        companies={companies.map((c) => ({ id: c.id, name: c.name }))}
      />

      <div className="mt-6">
        {bundles.length === 0 ? (
          <EmptyState
            title="No bundles yet"
            body="Create one against a company, then add candidates to it from the screening view."
          />
        ) : (
          <div className="overflow-x-auto rounded border border-hairline">
            <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
              <caption className="sr-only">All candidate bundles</caption>
              <thead>
                <tr className="border-b border-hairline-strong bg-raised">
                  {["Bundle", "Company", "Focus area", "Size", "State"].map(
                    (heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className={`px-4 py-2.5 text-eyebrow font-semibold uppercase text-muted ${
                          heading === "Size" ? "text-right" : ""
                        }`}
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {bundles.map((bundle) => (
                  <tr
                    key={bundle.id}
                    className="border-b border-hairline transition-colors last:border-0 hover:bg-raised"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/bundles/${bundle.id}`}
                        className="font-semibold text-navy underline-offset-4 hover:underline"
                      >
                        {bundle.title}
                      </Link>
                      {bundle.cgpaThreshold ? (
                        <span className="block text-xs tabular text-muted">
                          CGPA floor {bundle.cgpaThreshold}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate">
                      {bundle.companyName}
                    </td>
                    <td className="px-4 py-3 text-slate">
                      {FOCUS_LABEL[bundle.focusArea] ?? bundle.focusArea}
                    </td>
                    <td
                      data-figure
                      className="px-4 py-3 text-right font-semibold text-navy"
                    >
                      {bundle.size}
                    </td>
                    <td className="px-4 py-3">
                      {bundle.releasedAt ? (
                        <Pill tone="positive">Released</Pill>
                      ) : (
                        <Pill tone="muted">Draft</Pill>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
