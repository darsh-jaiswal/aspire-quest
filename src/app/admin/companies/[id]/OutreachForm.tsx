"use client";

import { useActionState, useRef } from "react";
import { logOutreach, type ActionState } from "../actions";

const INITIAL: ActionState = { status: "idle" };

const CHANNELS = [
  ["email", "Email"],
  ["call", "Call"],
  ["linkedin", "LinkedIn"],
  ["meeting", "Meeting"],
  ["referral", "Referral"],
  ["other", "Other"],
] as const;

export function OutreachForm({ companyId }: { companyId: number }) {
  const [state, action, pending] = useActionState(logOutreach, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await action(formData);
        formRef.current?.reset();
      }}
      className="rounded border border-hairline bg-raised p-5"
    >
      <input type="hidden" name="companyId" value={companyId} />

      <h2 className="text-eyebrow font-semibold uppercase text-muted">
        Log outreach
      </h2>

      <div className="mt-4 grid gap-3">
        <div>
          <label
            htmlFor="channel"
            className="block text-xs font-semibold text-navy"
          >
            Channel
          </label>
          <select
            id="channel"
            name="channel"
            defaultValue="email"
            className="mt-1.5 w-full rounded border border-hairline-strong bg-surface px-3 py-2 text-sm text-slate"
          >
            {CHANNELS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="note"
            className="block text-xs font-semibold text-navy"
          >
            What happened
          </label>
          <textarea
            id="note"
            name="note"
            rows={3}
            required
            placeholder="Spoke to the HR lead — sending the problem-statement template this week."
            className="mt-1.5 w-full rounded border border-hairline-strong bg-surface px-3 py-2 text-sm text-slate placeholder:text-muted/70"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="justify-self-start rounded border border-navy bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-hover disabled:opacity-50"
        >
          {pending ? "Saving…" : "Add to history"}
        </button>
      </div>

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
  );
}
