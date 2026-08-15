"use server";

import { headers } from "next/headers";
import { db } from "@/db";
import { alumniReferrals } from "@/db/schema";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { alumniReferralSchema, fieldErrors } from "@/lib/validation";

export type AlumniState =
  | { status: "idle" }
  | { status: "error"; message: string; errors?: Record<string, string> }
  | { status: "success"; company: string };

export async function submitReferral(
  _prev: AlumniState,
  formData: FormData,
): Promise<AlumniState> {
  const requestHeaders = await headers();
  const limit = await checkRateLimit("alumni", clientIp(requestHeaders));

  if (!limit.ok) {
    return {
      status: "error",
      message:
        limit.reason === "rate_limited"
          ? "This form has been submitted several times from your connection. Please wait a few minutes."
          : "The form is temporarily unavailable. Please try again shortly.",
    };
  }

  const parsed = alumniReferralSchema.safeParse({
    alumName: formData.get("alumName"),
    email: formData.get("email") ?? "",
    batch: formData.get("batch") ?? "",
    branch: formData.get("branch") ?? "",
    company: formData.get("company"),
    role: formData.get("role") ?? "",
    linkedin: formData.get("linkedin") ?? "",
    hiringInterest: formData.get("hiringInterest") === "on",
    notes: formData.get("notes") ?? "",
    companyFax: formData.get("companyFax") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Some details need fixing before we can record this referral.",
      errors: fieldErrors(parsed.error),
    };
  }

  const input = parsed.data;

  try {
    await db.insert(alumniReferrals).values({
      alumName: input.alumName,
      email: input.email || null,
      batch: input.batch || null,
      branch: input.branch || null,
      company: input.company,
      role: input.role || null,
      linkedin: input.linkedin || null,
      hiringInterest: input.hiringInterest,
      notes: input.notes || null,
    });

    return { status: "success", company: input.company };
  } catch (error) {
    console.error("[alumni] insert failed:", error);
    return {
      status: "error",
      message:
        "Something went wrong recording the referral. Please try again in a moment.",
    };
  }
}
