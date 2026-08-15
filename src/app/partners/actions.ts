"use server";

import { headers } from "next/headers";
import { db } from "@/db";
import { companies, problemStatements } from "@/db/schema";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { fieldErrors, partnerSchema } from "@/lib/validation";

export type PartnerState =
  | { status: "idle" }
  | { status: "error"; message: string; errors?: Record<string, string> }
  | { status: "success"; company: string };

export async function submitPartner(
  _prev: PartnerState,
  formData: FormData,
): Promise<PartnerState> {
  const requestHeaders = await headers();
  const limit = await checkRateLimit("partner", clientIp(requestHeaders));

  if (!limit.ok) {
    return {
      status: "error",
      message:
        limit.reason === "rate_limited"
          ? "This form has been submitted several times from your connection. Please wait a few minutes."
          : "The form is temporarily unavailable. Please try again shortly.",
    };
  }

  const parsed = partnerSchema.safeParse({
    companyName: formData.get("companyName"),
    website: formData.get("website") ?? "",
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone") ?? "",
    stipendMin: formData.get("stipendMin") ?? "",
    ppoTrack: formData.get("ppoTrack") === "on",
    problemTitle: formData.get("problemTitle"),
    problemDescription: formData.get("problemDescription"),
    focusArea: formData.get("focusArea"),
    companyFax: formData.get("companyFax") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Some details need fixing before we can record your interest.",
      errors: fieldErrors(parsed.error),
    };
  }

  const input = parsed.data;

  try {
    // A self-serve submission enters the pipeline as `interested`, not `lead`:
    // the company has already raised its hand.
    const [company] = await db
      .insert(companies)
      .values({
        name: input.companyName,
        website: input.website,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone || null,
        stipendMin: input.stipendMin,
        ppoTrack: input.ppoTrack,
        status: "interested",
        source: "self_serve",
      })
      .returning({ id: companies.id });

    if (company) {
      await db.insert(problemStatements).values({
        companyId: company.id,
        title: input.problemTitle,
        description: input.problemDescription,
        focusArea: input.focusArea as
          | "core_dev"
          | "aiml"
          | "robotics"
          | "other",
      });
    }

    return { status: "success", company: input.companyName };
  } catch (error) {
    console.error("[partners] insert failed:", error);
    return {
      status: "error",
      message:
        "Something went wrong recording your details. Please try again in a moment.",
    };
  }
}
