"use client";

import { useActionState } from "react";
import { FOCUS_AREAS, REGISTRATION } from "@/lib/content";
import { createBundle, type BundleActionState } from "./actions";

const INITIAL: BundleActionState = { status: "idle" };

const CONTROL =
  "mt-1.5 w-full rounded border border-hairline-strong bg-surface px-3 py-2 text-sm text-slate hover:border-muted focus:border-navy";

export function CreateBundleForm({
  companies,
}: {
  companies: { id: number; name: string }[];
}) {
  const [state, action, pending] = useActionState(createBundle, INITIAL);

  if (companies.length === 0) {
    return (
      <p className="rounded border border-hairline bg-raised px-5 py-4 text-sm text-muted">
        Add a company to the pipeline before creating a bundle — every bundle
        belongs to exactly one company.
      </p>
    );
  }

  return (
    <details className="rounded border border-hairline bg-raised">
      <summary className="cursor-pointer list-none px-5 py-3.5 text-sm font-semibold text-navy [&::-webkit-details-marker]:hidden">
        New bundle
      </summary>

      <form action={action} className="border-t border-hairline px-5 py-5">
        <div className="grid gap-4 lg:grid-cols-4">
          <div>
            <label
              htmlFor="companyId"
              className="block text-xs font-semibold text-navy"
            >
              Company
            </label>
            <select
              id="companyId"
              name="companyId"
              required
              defaultValue=""
              className={CONTROL}
            >
              <option value="" disabled>
                Select
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="title"
              className="block text-xs font-semibold text-navy"
            >
              Title
            </label>
            <input
              id="title"
              name="title"
              required
              placeholder="Robotics shortlist — round 1"
              className={CONTROL}
            />
          </div>

          <div>
            <label
              htmlFor="focusArea"
              className="block text-xs font-semibold text-navy"
            >
              Focus area
            </label>
            <select
              id="focusArea"
              name="focusArea"
              required
              defaultValue=""
              className={CONTROL}
            >
              <option value="" disabled>
                Select
              </option>
              {FOCUS_AREAS.map((area) => (
                <option key={area.code} value={area.code}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="cgpaThreshold"
              className="block text-xs font-semibold text-navy"
            >
              CGPA floor
            </label>
            <input
              id="cgpaThreshold"
              name="cgpaThreshold"
              inputMode="decimal"
              placeholder={REGISTRATION.defaultCgpaThreshold.toFixed(2)}
              className={`${CONTROL} tabular`}
            />
          </div>
        </div>

        <p className="mt-3 text-xs text-muted">
          The CGPA floor is recorded for auditability — it documents the bar
          this shortlist was built at. It does not filter automatically.
        </p>

        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded border border-navy bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-hover disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create bundle"}
        </button>

        <div aria-live="polite">
          {state.status !== "idle" ? (
            <p
              className={`mt-3 text-sm ${
                state.status === "success" ? "text-positive" : "text-critical"
              }`}
            >
              {state.message}
            </p>
          ) : null}
        </div>
      </form>
    </details>
  );
}
