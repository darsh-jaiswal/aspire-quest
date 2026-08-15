"use server";

import { headers } from "next/headers";
import { db } from "@/db";
import { students } from "@/db/schema";
import { generateRefCode } from "@/lib/ref-code";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { fieldErrors, studentRegistrationSchema } from "@/lib/validation";

export type RegisterState =
  | { status: "idle" }
  | { status: "error"; message: string; errors?: Record<string, string> }
  | { status: "success"; refCode: string };

/** Postgres unique-violation. */
const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown, constraint?: string): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { code?: string; constraint?: string; message?: string };
  if (candidate.code !== UNIQUE_VIOLATION) {
    // neon-http surfaces the code inside the message in some paths.
    if (!candidate.message?.includes(UNIQUE_VIOLATION)) return false;
  }
  if (!constraint) return true;
  return (
    candidate.constraint?.includes(constraint) ||
    candidate.message?.includes(constraint) ||
    false
  );
}

export async function registerStudent(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const requestHeaders = await headers();
  const limit = await checkRateLimit("register", clientIp(requestHeaders));

  if (!limit.ok) {
    return {
      status: "error",
      message:
        limit.reason === "rate_limited"
          ? "You have submitted this form several times already. Please wait a few minutes and try again."
          : "Registration is temporarily unavailable. Please try again shortly.",
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
    };
  }

  const input = parsed.data;

  // Retry on the (rare) ref-code collision. Three attempts is generous given
  // the code space; beyond that something else is wrong.
  for (let attempt = 0; attempt < 3; attempt++) {
    const refCode = generateRefCode();

    try {
      await db.insert(students).values({
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
      });

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
      };
    }
  }

  console.error("[register] exhausted ref-code attempts");
  return {
    status: "error",
    message:
      "Something went wrong saving your application. Please try again in a moment.",
  };
}
