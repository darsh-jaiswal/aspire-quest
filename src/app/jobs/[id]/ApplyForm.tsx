"use client";

import { useActionState } from "react";
import { applyToOpening, type ApplyState } from "../actions";

/**
 * The one-click apply. Rendered only when the server has already judged the
 * viewer eligible — every state that can't apply gets static markup from the
 * page instead. The action re-checks everything anyway.
 */

const INITIAL: ApplyState = { status: "idle" };

export function ApplyForm({ openingId }: { openingId: number }) {
  const [state, action, pending] = useActionState(applyToOpening, INITIAL);

  if (state.status === "applied") {
    return (
      <div className="rounded border border-positive/30 bg-positive/5 px-4 py-3.5">
        <p className="text-sm font-semibold text-positive">
          Application submitted.
        </p>
        <p className="mt-1 text-sm text-slate">
          The company sees your registration profile and resume. Shortlist
          news comes from the Aspire Quest team — there is nothing else you
          need to do here.
        </p>
      </div>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="openingId" value={openingId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center rounded border border-navy bg-navy px-6 py-3 text-sm font-semibold tracking-tight text-white transition-colors hover:bg-navy-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Applying…" : "Apply with my registration"}
      </button>
      <p className="mt-2 text-xs text-muted">
        One click — your registered profile and resume are the application.
      </p>
      {state.status === "error" ? (
        <p role="alert" className="mt-2 text-sm font-semibold text-critical">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
