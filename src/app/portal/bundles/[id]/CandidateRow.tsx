"use client";

import { useActionState } from "react";
import { Pill } from "@/components/admin/Shell";
import { toggleValue } from "@/lib/interest";
import {
  saveCandidateNote,
  setCandidateInterest,
  type PortalActionState,
} from "../../actions";

/**
 * One candidate, with the recruiter's two affordances: a three-state interest
 * mark and a private note.
 *
 * The interest control is three buttons in one form rather than a checkbox,
 * because "not yet reviewed" is a real and meaningful state — a set where
 * nobody has been marked must not read as a set where everyone was rejected.
 *
 * The note is deliberately behind a disclosure rather than an always-open
 * textarea: the row is a scanning surface first, and forty open textareas would
 * bury the candidates themselves.
 */

const INITIAL: PortalActionState = { status: "idle" };

type Props = {
  bundleId: number;
  studentId: number;
  refCode: string;
  fullName: string;
  email: string;
  branch: string;
  programme: string;
  year: string;
  cgpa: string;
  skills: readonly string[];
  hasResume: boolean;
  interested: boolean | null;
  recruiterNote: string | null;
};

export function CandidateRow({
  bundleId,
  studentId,
  refCode,
  fullName,
  email,
  branch,
  programme,
  year,
  cgpa,
  skills,
  hasResume,
  interested,
  recruiterNote,
}: Props) {
  const [interestState, interestAction, interestPending] = useActionState(
    setCandidateInterest,
    INITIAL,
  );
  const [noteState, noteAction, notePending] = useActionState(
    saveCandidateNote,
    INITIAL,
  );

  return (
    <li className="border-b border-hairline py-5">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-semibold text-navy">{fullName}</h2>
            <span data-figure className="text-xs text-muted">
              {refCode}
            </span>
            {interested === true ? (
              <Pill tone="positive">Interested</Pill>
            ) : interested === false ? (
              <Pill tone="muted">Passed</Pill>
            ) : null}
          </div>

          <p className="mt-1.5 text-sm text-slate">
            {branch} · {programme} · {year} ·{" "}
            <span data-figure className="font-semibold text-navy">
              {cgpa}
            </span>{" "}
            CGPA
          </p>

          <p className="mt-1 text-sm text-muted">
            <a
              href={`mailto:${email}`}
              className="underline-offset-4 hover:text-navy hover:underline"
            >
              {email}
            </a>
          </p>

          {skills.length > 0 ? (
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-sm border border-hairline bg-raised px-2 py-0.5 text-xs text-slate"
                >
                  {skill}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-3">
          {hasResume ? (
            <a
              href={`/api/resume/download?studentId=${studentId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-hairline-strong px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:border-navy"
            >
              Resume
              <span className="sr-only"> for {fullName} (opens a PDF)</span>
            </a>
          ) : (
            <span className="text-xs text-muted">No resume on file</span>
          )}

          <form action={interestAction}>
            <input type="hidden" name="bundleId" value={bundleId} />
            <input type="hidden" name="studentId" value={studentId} />
            <fieldset
              disabled={interestPending}
              className="flex gap-1.5 disabled:opacity-50"
            >
              <legend className="sr-only">Your interest in {fullName}</legend>

              <button
                type="submit"
                name="interested"
                value={toggleValue(interested, true)}
                aria-pressed={interested === true}
                className={`rounded border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  interested === true
                    ? "border-amber bg-amber text-white hover:bg-amber-hover"
                    : "border-hairline-strong text-navy hover:border-amber hover:text-amber"
                }`}
              >
                Interested
              </button>

              <button
                type="submit"
                name="interested"
                value={toggleValue(interested, false)}
                aria-pressed={interested === false}
                className={`rounded border px-3 py-1.5 text-sm transition-colors ${
                  interested === false
                    ? "border-hairline-strong bg-raised font-semibold text-slate"
                    : "border-hairline-strong text-muted hover:text-navy"
                }`}
              >
                Pass
              </button>
            </fieldset>
          </form>

          <div aria-live="polite" className="text-right">
            {interestState.status !== "idle" ? (
              <p
                className={`text-xs ${
                  interestState.status === "success"
                    ? "text-positive"
                    : "text-critical"
                }`}
              >
                {interestState.message}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <details className="mt-4 group">
        <summary className="cursor-pointer list-none text-sm text-muted underline-offset-4 hover:text-navy hover:underline">
          {recruiterNote ? "Your note" : "Add a note"}
          <span aria-hidden="true" className="ml-1 inline-block">
            ›
          </span>
        </summary>

        {recruiterNote ? (
          <p className="mt-2 max-w-[68ch] text-sm text-slate">
            {recruiterNote}
          </p>
        ) : null}

        <form action={noteAction} className="mt-3 max-w-[68ch]">
          <input type="hidden" name="bundleId" value={bundleId} />
          <input type="hidden" name="studentId" value={studentId} />

          <label
            htmlFor={`note-${studentId}`}
            className="text-eyebrow font-semibold uppercase text-muted"
          >
            Private note
          </label>
          <textarea
            id={`note-${studentId}`}
            name="note"
            rows={3}
            maxLength={1000}
            defaultValue={recruiterNote ?? ""}
            placeholder="Visible to your team and the Aspire Quest organisers. Never to the student."
            className="mt-1.5 w-full rounded border border-hairline-strong bg-surface px-3 py-2 text-sm text-navy placeholder:text-muted focus:border-navy focus:outline-none"
          />

          <div className="mt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={notePending}
              className="rounded border border-navy bg-navy px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-navy-hover disabled:opacity-50"
            >
              {notePending ? "Saving…" : "Save note"}
            </button>

            <span aria-live="polite">
              {noteState.status !== "idle" ? (
                <span
                  className={`text-xs ${
                    noteState.status === "success"
                      ? "text-positive"
                      : "text-critical"
                  }`}
                >
                  {noteState.message}
                </span>
              ) : null}
            </span>
          </div>
        </form>
      </details>
    </li>
  );
}
