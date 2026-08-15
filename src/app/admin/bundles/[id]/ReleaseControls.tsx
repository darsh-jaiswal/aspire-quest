"use client";

import { useActionState } from "react";
import {
  removeFromBundle,
  setBundleRelease,
  type BundleActionState,
} from "../actions";

const INITIAL: BundleActionState = { status: "idle" };

export function ReleaseControls({
  bundleId,
  isReleased,
  companyName,
  size,
}: {
  bundleId: number;
  isReleased: boolean;
  companyName: string;
  size: number;
}) {
  const [state, action, pending] = useActionState(setBundleRelease, INITIAL);

  return (
    <div className="rounded border border-hairline bg-raised p-5">
      <h2 className="text-eyebrow font-semibold uppercase text-muted">
        Release
      </h2>

      <p className="mt-3 max-w-[52ch] text-sm text-slate">
        {isReleased ? (
          <>
            Recruiters at{" "}
            <span className="font-semibold text-navy">{companyName}</span> can
            currently see these{" "}
            <span data-figure className="font-semibold text-navy">
              {size}
            </span>{" "}
            candidates and open their resumes. Every access is logged.
          </>
        ) : (
          <>
            This bundle is a draft. Releasing it lets recruiters at{" "}
            <span className="font-semibold text-navy">{companyName}</span> see
            these{" "}
            <span data-figure className="font-semibold text-navy">
              {size}
            </span>{" "}
            candidates and open their resumes.
          </>
        )}
      </p>

      <form action={action} className="mt-4">
        <input type="hidden" name="bundleId" value={bundleId} />
        <input type="hidden" name="release" value={String(!isReleased)} />
        <button
          type="submit"
          disabled={pending || size === 0}
          className={`rounded border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isReleased
              ? "border-hairline-strong text-navy hover:border-critical hover:text-critical"
              : "border-amber bg-amber text-white hover:bg-amber-hover"
          }`}
        >
          {pending
            ? "Working…"
            : isReleased
              ? "Withdraw from recruiters"
              : "Release to recruiters"}
        </button>
        {size === 0 ? (
          <p className="mt-2 text-xs text-muted">
            Add at least one candidate before releasing.
          </p>
        ) : null}
      </form>

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
    </div>
  );
}

export function RemoveButton({
  bundleId,
  studentId,
  studentName,
}: {
  bundleId: number;
  studentId: number;
  studentName: string;
}) {
  const [, action, pending] = useActionState(removeFromBundle, INITIAL);

  return (
    <form action={action}>
      <input type="hidden" name="bundleId" value={bundleId} />
      <input type="hidden" name="studentId" value={studentId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-muted underline-offset-4 transition-colors hover:text-critical hover:underline disabled:opacity-50"
      >
        <span className="sr-only">Remove {studentName} from this bundle</span>
        <span aria-hidden="true">{pending ? "Removing…" : "Remove"}</span>
      </button>
    </form>
  );
}
