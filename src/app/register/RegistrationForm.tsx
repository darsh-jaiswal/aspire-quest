"use client";

import { upload } from "@vercel/blob/client";
import { useActionState, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Checkbox,
  Field,
  Honeypot,
  Input,
  Select,
  Textarea,
  describedBy,
} from "@/components/ui/Field";
import { BRANCHES, FOCUS_AREAS, REGISTRATION } from "@/lib/content";
import { registerStudent, type RegisterState } from "./actions";

type UploadState =
  | { phase: "empty" }
  | { phase: "uploading"; percent: number; name: string }
  | { phase: "done"; key: string; name: string; bytes: number }
  | { phase: "error"; message: string };

const INITIAL: RegisterState = { status: "idle" };

export function RegistrationForm() {
  const [state, formAction, pending] = useActionState(registerStudent, INITIAL);
  const [file, setFile] = useState<UploadState>({ phase: "empty" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  const fid = (name: string) => `${id}-${name}`;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return setFile({ phase: "empty" });

    // Client-side checks are a courtesy; the upload token enforces both again.
    if (selected.type !== "application/pdf") {
      setFile({ phase: "error", message: "Your resume must be a PDF." });
      return;
    }
    if (selected.size > REGISTRATION.resumeMaxBytes) {
      setFile({
        phase: "error",
        message: `That file is ${(selected.size / 1024 / 1024).toFixed(1)} MB. The limit is ${REGISTRATION.resumeMaxLabel}.`,
      });
      return;
    }

    setFile({ phase: "uploading", percent: 0, name: selected.name });

    try {
      const blob = await upload(selected.name, selected, {
        access: "private",
        handleUploadUrl: "/api/resume/upload",
        contentType: "application/pdf",
        onUploadProgress: ({ percentage }) =>
          setFile({
            phase: "uploading",
            percent: Math.round(percentage),
            name: selected.name,
          }),
      });

      setFile({
        phase: "done",
        key: blob.pathname,
        name: selected.name,
        bytes: selected.size,
      });
    } catch (error) {
      console.error("[register] resume upload failed:", error);
      setFile({
        phase: "error",
        message:
          "That upload did not complete. Check your connection and try again.",
      });
    }
  }

  if (state.status === "success") {
    return <SuccessPanel refCode={state.refCode} />;
  }

  const uploadBusy = file.phase === "uploading";
  const resumeError =
    file.phase === "error" ? file.message : errors.resumeBlobKey;

  return (
    <form action={formAction} className="relative" noValidate>
      <Honeypot name="website" />

      {state.status === "error" ? (
        <div
          role="alert"
          className="mb-8 rounded border border-critical/30 bg-critical/5 px-4 py-3 text-sm text-critical"
        >
          {state.message}
        </div>
      ) : null}

      <fieldset className="border-0 p-0">
        <legend className="text-eyebrow font-semibold uppercase text-muted">
          About you
        </legend>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Field
            label="Full name"
            htmlFor={fid("fullName")}
            error={errors.fullName}
            required
          >
            <Input
              id={fid("fullName")}
              name="fullName"
              autoComplete="name"
              required
              aria-invalid={errors.fullName ? true : undefined}
              aria-describedby={describedBy(fid("fullName"), undefined, errors.fullName)}
            />
          </Field>

          <Field
            label="Email"
            htmlFor={fid("email")}
            error={errors.email}
            hint="Used for shortlist updates. One application per address."
            required
          >
            <Input
              id={fid("email")}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={describedBy(fid("email"), "hint", errors.email)}
            />
          </Field>

          <Field
            label="Mobile number"
            htmlFor={fid("phone")}
            error={errors.phone}
            hint="10 digits, Indian mobile."
            required
          >
            <Input
              id={fid("phone")}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              className="tabular"
              aria-invalid={errors.phone ? true : undefined}
              aria-describedby={describedBy(fid("phone"), "hint", errors.phone)}
            />
          </Field>

          <Field
            label="CGPA"
            htmlFor={fid("cgpa")}
            error={errors.cgpa}
            hint="Current cumulative, e.g. 7.85."
            required
          >
            <Input
              id={fid("cgpa")}
              name="cgpa"
              inputMode="decimal"
              placeholder="7.85"
              required
              className="tabular"
              aria-invalid={errors.cgpa ? true : undefined}
              aria-describedby={describedBy(fid("cgpa"), "hint", errors.cgpa)}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="mt-12 border-0 p-0">
        <legend className="text-eyebrow font-semibold uppercase text-muted">
          Your programme
        </legend>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <Field
            label="Programme"
            htmlFor={fid("programme")}
            error={errors.programme}
            required
          >
            <Select id={fid("programme")} name="programme" required defaultValue="">
              <option value="" disabled>
                Select
              </option>
              <option value="B.Tech">B.Tech</option>
              <option value="MBA.Tech">MBA.Tech</option>
            </Select>
          </Field>

          <Field
            label="Branch"
            htmlFor={fid("branch")}
            error={errors.branch}
            required
          >
            <Select id={fid("branch")} name="branch" required defaultValue="">
              <option value="" disabled>
                Select
              </option>
              {BRANCHES.map((branch) => (
                <option key={branch.code} value={branch.code}>
                  {branch.name} ({branch.programme})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Year" htmlFor={fid("year")} error={errors.year} required>
            <Select id={fid("year")} name="year" required defaultValue="">
              <option value="" disabled>
                Select
              </option>
              {REGISTRATION.years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </fieldset>

      <fieldset className="mt-12 border-0 p-0">
        <legend className="text-eyebrow font-semibold uppercase text-muted">
          What you want to be considered for
        </legend>

        <p className="mt-3 text-sm text-muted">
          Pick one. This is what your candidate bundle is built from.
        </p>

        <div
          role="radiogroup"
          aria-label="Focus area"
          className="mt-5 grid gap-px overflow-hidden rounded border border-hairline bg-hairline sm:grid-cols-2"
        >
          {FOCUS_AREAS.map((area) => (
            <label
              key={area.code}
              className="group flex cursor-pointer gap-3.5 bg-surface p-5 transition-colors hover:bg-raised has-[:checked]:bg-amber-wash"
            >
              <input
                type="radio"
                name="focusArea"
                value={area.code}
                required
                className="mt-1 size-4 shrink-0 accent-[var(--color-navy)]"
              />
              <span>
                <span className="block font-semibold text-navy">
                  {area.name}
                </span>
                <span className="mt-1 block text-sm text-slate">
                  {area.summary}
                </span>
              </span>
            </label>
          ))}
        </div>
        {errors.focusArea ? (
          <p className="mt-2 text-sm text-critical" role="alert">
            {errors.focusArea}
          </p>
        ) : null}

        <Field
          label="Skills"
          htmlFor={fid("skills")}
          error={errors.skills}
          hint="Comma separated, up to 12. e.g. Python, ROS, PCB design"
          className="mt-8"
        >
          <Textarea
            id={fid("skills")}
            name="skills"
            rows={2}
            className="min-h-0"
            aria-describedby={describedBy(fid("skills"), "hint", errors.skills)}
          />
        </Field>
      </fieldset>

      <fieldset className="mt-12 border-0 p-0">
        <legend className="text-eyebrow font-semibold uppercase text-muted">
          Resume
        </legend>

        <Field
          label="Resume"
          htmlFor={fid("resume")}
          error={resumeError}
          hint={`${REGISTRATION.resumeAcceptedLabel}, up to ${REGISTRATION.resumeMaxLabel}.`}
          required
          className="mt-6"
        >
          <input
            ref={fileInputRef}
            id={fid("resume")}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            aria-invalid={resumeError ? true : undefined}
            aria-describedby={describedBy(fid("resume"), "hint", resumeError)}
            className="block w-full cursor-pointer rounded border border-hairline-strong bg-surface text-sm text-slate file:mr-4 file:cursor-pointer file:border-0 file:border-r file:border-hairline-strong file:bg-raised file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-navy hover:file:bg-sunken"
          />

          <div aria-live="polite" className="mt-3 text-sm">
            {file.phase === "uploading" ? (
              <p className="text-muted">
                Uploading {file.name} —{" "}
                <span data-figure className="font-semibold text-navy">
                  {file.percent}%
                </span>
              </p>
            ) : null}
            {file.phase === "done" ? (
              <p className="font-semibold text-positive">
                {file.name} uploaded.
              </p>
            ) : null}
          </div>
        </Field>

        {file.phase === "done" ? (
          <>
            <input type="hidden" name="resumeBlobKey" value={file.key} />
            <input type="hidden" name="resumeFilename" value={file.name} />
            <input type="hidden" name="resumeBytes" value={file.bytes} />
          </>
        ) : null}
      </fieldset>

      <div className="mt-12 rounded border border-hairline bg-raised p-6">
        <Checkbox
          id={fid("consent")}
          name="consent"
          required
          error={errors.consent}
          label={
            <>
              I agree that MPSTME may store the details and resume I have
              submitted, and share them with the partner companies shortlisting
              for Aspire Quest. I understand my resume is kept in private
              storage, that every access to it is logged, and that my records
              are deleted after the stated retention period.
            </>
          }
        />
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button
          type="submit"
          variant="accent"
          disabled={pending || uploadBusy || file.phase !== "done"}
        >
          {pending ? "Submitting…" : "Submit application"}
        </Button>
        <p className="text-sm text-muted">
          {file.phase === "done"
            ? "Your reference code appears on the next screen."
            : "Upload your resume to enable submission."}
        </p>
      </div>
    </form>
  );
}

function SuccessPanel({ refCode }: { refCode: string }) {
  return (
    <div className="rounded border border-hairline bg-raised p-8 md:p-12">
      <p className="text-eyebrow font-semibold uppercase text-positive">
        Application received
      </p>
      <h2 className="mt-5 text-h2 font-semibold">Save this reference code.</h2>
      <p className="mt-4 max-w-[52ch] text-slate">
        There is no login for students, so this code is how the organising team
        identifies your application. Write it down or screenshot this screen.
      </p>

      <p
        data-figure
        className="mt-8 inline-block rounded border-2 border-navy bg-surface px-7 py-5 text-h1 font-semibold tracking-tight text-navy"
      >
        {refCode}
      </p>

      <p className="mt-8 max-w-[52ch] text-sm text-muted">
        Shortlisted candidates are contacted by email once partner companies
        have reviewed the candidate bundles for their focus area.
      </p>
    </div>
  );
}
