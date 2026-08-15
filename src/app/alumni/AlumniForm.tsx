"use client";

import { useActionState, useId } from "react";
import { Button } from "@/components/ui/Button";
import {
  Checkbox,
  Field,
  Honeypot,
  Input,
  Textarea,
  describedBy,
} from "@/components/ui/Field";
import { submitReferral, type AlumniState } from "./actions";

const INITIAL: AlumniState = { status: "idle" };

export function AlumniForm() {
  const [state, formAction, pending] = useActionState(submitReferral, INITIAL);
  const id = useId();
  const fid = (name: string) => `${id}-${name}`;
  const errors = state.status === "error" ? (state.errors ?? {}) : {};

  if (state.status === "success") {
    return (
      <div className="rounded border border-hairline bg-raised p-8 md:p-12">
        <p className="text-eyebrow font-semibold uppercase text-positive">
          Referral recorded
        </p>
        <h2 className="mt-5 text-h2 font-semibold">
          Thank you — we&rsquo;ll approach {state.company}.
        </h2>
        <p className="mt-4 max-w-[54ch] text-slate">
          The organising team picks this up as a warm lead. A named referral
          from an alum is the most effective way a company enters the pipeline,
          so this genuinely helps.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="relative" noValidate>
      <Honeypot name="companyFax" />

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
            label="Your name"
            htmlFor={fid("alumName")}
            error={errors.alumName}
            required
          >
            <Input
              id={fid("alumName")}
              name="alumName"
              required
              autoComplete="name"
              aria-invalid={errors.alumName ? true : undefined}
            />
          </Field>

          <Field label="Email" htmlFor={fid("email")} error={errors.email}>
            <Input
              id={fid("email")}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
            />
          </Field>

          <Field label="Batch" htmlFor={fid("batch")} error={errors.batch}>
            <Input
              id={fid("batch")}
              name="batch"
              placeholder="2019"
              className="tabular"
            />
          </Field>

          <Field label="Branch" htmlFor={fid("branch")} error={errors.branch}>
            <Input id={fid("branch")} name="branch" placeholder="B.Tech CS" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="mt-12 border-0 p-0">
        <legend className="text-eyebrow font-semibold uppercase text-muted">
          The company
        </legend>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Field
            label="Company"
            htmlFor={fid("company")}
            error={errors.company}
            hint="Where you work, or a company you can introduce us to."
            required
          >
            <Input
              id={fid("company")}
              name="company"
              required
              autoComplete="organization"
              aria-invalid={errors.company ? true : undefined}
              aria-describedby={describedBy(fid("company"), "hint", errors.company)}
            />
          </Field>

          <Field label="Your role" htmlFor={fid("role")} error={errors.role}>
            <Input
              id={fid("role")}
              name="role"
              autoComplete="organization-title"
            />
          </Field>

          <Field
            label="LinkedIn"
            htmlFor={fid("linkedin")}
            error={errors.linkedin}
            className="sm:col-span-2"
          >
            <Input
              id={fid("linkedin")}
              name="linkedin"
              inputMode="url"
              placeholder="linkedin.com/in/…"
            />
          </Field>
        </div>

        <div className="mt-6">
          <Checkbox
            id={fid("hiringInterest")}
            name="hiringInterest"
            label="I know this company is hiring interns, or I can find out."
          />
        </div>

        <Field
          label="Anything useful"
          htmlFor={fid("notes")}
          error={errors.notes}
          hint="Who to contact, what the team works on, timing — whatever helps."
          className="mt-8"
        >
          <Textarea
            id={fid("notes")}
            name="notes"
            rows={5}
            aria-describedby={describedBy(fid("notes"), "hint", errors.notes)}
          />
        </Field>
      </fieldset>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Sending…" : "Submit referral"}
        </Button>
        <p className="text-sm text-muted">Takes about two minutes.</p>
      </div>
    </form>
  );
}
