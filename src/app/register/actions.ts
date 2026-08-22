"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { waitUntil } from "@vercel/functions";
import { db } from "@/db";
import { students } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { RegistrationConfirmationEmail } from "@/emails/RegistrationConfirmation";
import { generateRefCode } from "@/lib/ref-code";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { fieldErrors, studentRegistrationSchema } from "@/lib/validation";

/**
 * What the student typed, echoed back on error.
 *
 * React resets uncontrolled form fields once a `<form action>` completes —
 * success or failure. Without this, any single validation mistake (or a
 * transient server error) forces retyping the entire form, resume upload
 * included. Deliberately excludes the resume fields: that state already
 * survives independently in RegistrationForm's `file` useState.
 */
export type SubmittedValues = {
  fullName: string;
  email: string;
  phone: string;
  cgpa: string;
  programme: string;
  branch: string;
  year: string;
  focusArea: string;
  skills: string;
  consent: boolean;
};

export type RegisterState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      errors?: Record<string, string>;
      values?: SubmittedValues;
    }
  | { status: "success"; refCode: string };

/** Postgres unique-violation. */
const UNIQUE_VIOLATION = "23505";

type PgErrorLike = { code?: string; constraint?: string; message?: string; cause?: unknown };

function isUniqueViolation(error: unknown, constraint?: string): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as PgErrorLike;

  // Drizzle wraps the real Postgres error (with `code`/`constraint`) inside
  // a "Failed query" error's `.cause` — check both, cause first since that's
  // where the fields actually live for a query built with the query builder.
  const layers = [candidate.cause, candidate].filter(
    (layer): layer is PgErrorLike => typeof layer === "object" && layer !== null,
  );

  for (const layer of layers) {
    const matchesCode =
      layer.code === UNIQUE_VIOLATION ||
      // neon-http surfaces the code inside the message in some paths.
      layer.message?.includes(UNIQUE_VIOLATION);
    if (!matchesCode) continue;
    if (!constraint) return true;
    if (layer.constraint?.includes(constraint) || layer.message?.includes(constraint)) {
      return true;
    }
  }

  return false;
}

function submittedValuesFrom(formData: FormData): SubmittedValues {
  return {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    cgpa: String(formData.get("cgpa") ?? ""),
    programme: String(formData.get("programme") ?? ""),
    branch: String(formData.get("branch") ?? ""),
    year: String(formData.get("year") ?? ""),
    focusArea: String(formData.get("focusArea") ?? ""),
    skills: String(formData.get("skills") ?? ""),
    consent: formData.get("consent") === "on",
  };
}

export async function registerStudent(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const values = submittedValuesFrom(formData);

  const requestHeaders = await headers();
  const limit = await checkRateLimit("register", clientIp(requestHeaders));

  if (!limit.ok) {
    return {
      status: "error",
      message:
        limit.reason === "rate_limited"
          ? "You have submitted this form several times already. Please wait a few minutes and try again."
          : "Registration is temporarily unavailable. Please try again shortly.",
      values,
    };
  }

  const raw = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    branch: formData.get("branch"),
    programme: formData.get("programme"),
    year: formData.get("year"),
    cgpa: formData.get("cgpa"),
    focusArea: formData.get("focusArea"),
    skills: String(formData.get("skills") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    resumeBlobKey: formData.get("resumeBlobKey"),
    resumeFilename: formData.get("resumeFilename") ?? undefined,
    resumeBytes: Number(formData.get("resumeBytes") ?? 0),
    consent: formData.get("consent") === "on",
    website: formData.get("website") ?? "",
  };

  const parsed = studentRegistrationSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Some details need fixing before we can accept your application.",
      errors: fieldErrors(parsed.error),
      values,
    };
  }

  const input = parsed.data;

  // Retry on the (rare) ref-code collision. Three attempts is generous given
  // the code space; beyond that something else is wrong.
  for (let attempt = 0; attempt < 3; attempt++) {
    const refCode = generateRefCode();

    try {
      const [inserted] = await db
        .insert(students)
        .values({
          refCode,
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          branch: input.branch,
          programme: input.programme,
          year: input.year,
          cgpa: input.cgpa,
          focusArea: input.focusArea as "core_dev" | "aiml" | "robotics" | "other",
          skills: input.skills,
          resumeBlobKey: input.resumeBlobKey,
          resumeFilename: input.resumeFilename,
          resumeBytes: input.resumeBytes,
          consentAt: new Date(),
        })
        .returning({ id: students.id });

      // Best-effort — the registration already saved. A failed confirmation
      // email must never turn into a failed registration. waitUntil keeps
      // this running after the response is sent, instead of racing the
      // function's teardown.
      if (inserted) {
        const studentId = inserted.id;
        waitUntil(
          sendEmail({
            to: input.email,
            subject: `You're registered for Aspire Quest — ${refCode}`,
            react: RegistrationConfirmationEmail({
              fullName: input.fullName,
              refCode,
            }),
            idempotencyKey: `registration-confirmation/${refCode}`,
          })
            .then((sent) => {
              if (!sent) return;
              return db
                .update(students)
                .set({ confirmationEmailSentAt: new Date() })
                .where(eq(students.id, studentId));
            })
            .catch((error) => {
              console.error(
                "[register] confirmation email follow-up failed:",
                error,
              );
            }),
        );
      }

      return { status: "success", refCode };
    } catch (error) {
      if (isUniqueViolation(error, "students_email_idx")) {
        return {
          status: "error",
          message: "An application already exists for this email address.",
          errors: {
            email:
              "This email has already been registered. Contact the organising team if you need to change your application.",
          },
          values,
        };
      }

      if (isUniqueViolation(error, "students_ref_code_idx")) {
        continue; // collision — generate another code
      }

      console.error("[register] insert failed:", error);
      return {
        status: "error",
        message:
          "Something went wrong saving your application. Please try again in a moment.",
        values,
      };
    }
  }

  console.error("[register] exhausted ref-code attempts");
  return {
    status: "error",
    message:
      "Something went wrong saving your application. Please try again in a moment.",
    values,
  };
}
