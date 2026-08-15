"use client";

import { useActionState } from "react";
import { promoteReferral, type ActionState } from "../companies/actions";

const INITIAL: ActionState = { status: "idle" };

export function PromoteButton({
  referralId,
  company,
}: {
  referralId: number;
  company: string;
}) {
  const [state, action, pending] = useActionState(promoteReferral, INITIAL);

  return (
    <div>
      <form action={action}>
        <input type="hidden" name="referralId" value={referralId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded border border-hairline-strong px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-navy hover:bg-raised disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add as lead"}
        </button>
      </form>
      <div aria-live="polite">
        {state.status === "error" ? (
          <p className="mt-1.5 text-xs text-critical">{state.message}</p>
        ) : null}
      </div>
      <span className="sr-only">{company}</span>
    </div>
  );
}
