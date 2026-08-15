"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { alumniReferrals, companies, outreachLog } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { parseCsvRecords, pick } from "@/lib/csv";

export type ActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

const companyId = z.coerce.number().int().positive();

const statusSchema = z.enum([
  "lead",
  "contacted",
  "interested",
  "committed",
  "onboarded",
]);

/** Move a company along the pipeline. */
export async function setCompanyStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = companyId.safeParse(formData.get("companyId"));
  const status = statusSchema.safeParse(formData.get("status"));

  if (!id.success || !status.success) {
    return { status: "error", message: "Could not read that change." };
  }

  try {
    await db
      .update(companies)
      .set({ status: status.data, updatedAt: new Date() })
      .where(eq(companies.id, id.data));

    revalidatePath("/admin/companies");
    revalidatePath(`/admin/companies/${id.data}`);
    revalidatePath("/admin");

    return { status: "success", message: `Moved to ${status.data}.` };
  } catch (error) {
    console.error("[admin/companies] status update failed:", error);
    return { status: "error", message: "Could not update that company." };
  }
}

const outreachSchema = z.object({
  companyId,
  channel: z.enum(["email", "call", "linkedin", "meeting", "referral", "other"]),
  note: z.string().trim().min(3, "Write a short note.").max(2000),
});

/** Append to a company's outreach history. */
export async function logOutreach(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdmin();

  const parsed = outreachSchema.safeParse({
    companyId: formData.get("companyId"),
    channel: formData.get("channel"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]!.message };
  }

  try {
    await db.insert(outreachLog).values({
      companyId: parsed.data.companyId,
      actor: actor.userId,
      channel: parsed.data.channel,
      note: parsed.data.note,
    });

    // Touching the company keeps the pipeline sorted by real activity.
    await db
      .update(companies)
      .set({ updatedAt: new Date() })
      .where(eq(companies.id, parsed.data.companyId));

    revalidatePath(`/admin/companies/${parsed.data.companyId}`);
    return { status: "success", message: "Logged." };
  } catch (error) {
    console.error("[admin/companies] outreach log failed:", error);
    return { status: "error", message: "Could not save that note." };
  }
}

/** Turn an alumni referral into a company lead. */
export async function promoteReferral(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const referralId = z.coerce
    .number()
    .int()
    .positive()
    .safeParse(formData.get("referralId"));

  if (!referralId.success) {
    return { status: "error", message: "Could not read that referral." };
  }

  try {
    const [referral] = await db
      .select()
      .from(alumniReferrals)
      .where(eq(alumniReferrals.id, referralId.data))
      .limit(1);

    if (!referral) {
      return { status: "error", message: "That referral no longer exists." };
    }
    if (referral.promotedCompanyId) {
      return { status: "error", message: "That referral is already a lead." };
    }

    const [company] = await db
      .insert(companies)
      .values({
        name: referral.company ?? referral.alumName,
        status: "lead",
        source: "alumni_referral",
        notes: [
          `Referred by ${referral.alumName}`,
          referral.batch ? `Batch ${referral.batch}` : null,
          referral.role ? `Role: ${referral.role}` : null,
          referral.notes,
        ]
          .filter(Boolean)
          .join(" · "),
      })
      .returning({ id: companies.id });

    if (company) {
      await db
        .update(alumniReferrals)
        .set({ promotedCompanyId: company.id })
        .where(eq(alumniReferrals.id, referral.id));
    }

    revalidatePath("/admin/alumni");
    revalidatePath("/admin/companies");
    revalidatePath("/admin");

    return {
      status: "success",
      message: `${referral.company ?? referral.alumName} added as a lead.`,
    };
  } catch (error) {
    console.error("[admin/companies] promote failed:", error);
    return { status: "error", message: "Could not promote that referral." };
  }
}

/**
 * Bulk import of the Placement Cell recruiter list or an alumni company list.
 *
 * Header names are normalised, so "Company", "company name" and "COMPANY_NAME"
 * all work — these files come from spreadsheets maintained by hand, and
 * rejecting the whole file over a header spelling helps nobody.
 */
export async function importCompanies(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose a CSV file to import." };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { status: "error", message: "That file is larger than 2 MB." };
  }

  const source = formData.get("source");
  const parsedSource = z
    .enum(["placement_cell", "alumni_referral", "research"])
    .safeParse(source);
  if (!parsedSource.success) {
    return { status: "error", message: "Pick where this list came from." };
  }

  let records: Record<string, string>[];
  try {
    records = parseCsvRecords(await file.text());
  } catch (error) {
    console.error("[admin/companies] csv parse failed:", error);
    return { status: "error", message: "Could not read that file as CSV." };
  }

  const rows = records
    .map((record) => ({
      name: pick(record, "company", "company name", "name", "organisation"),
      website: pick(record, "website", "url", "site"),
      contactName: pick(record, "contact", "contact name", "hr", "recruiter"),
      contactEmail: pick(record, "email", "contact email", "e mail"),
      contactPhone: pick(record, "phone", "contact phone", "mobile"),
    }))
    .filter((row): row is typeof row & { name: string } => Boolean(row.name));

  if (rows.length === 0) {
    return {
      status: "error",
      message:
        "No rows had a company name. Check the file has a 'Company' column.",
    };
  }

  try {
    await db.insert(companies).values(
      rows.map((row) => ({
        name: row.name,
        website: row.website,
        contactName: row.contactName,
        contactEmail: row.contactEmail,
        contactPhone: row.contactPhone,
        status: "lead" as const,
        source: parsedSource.data,
      })),
    );

    revalidatePath("/admin/companies");
    revalidatePath("/admin");

    return {
      status: "success",
      message: `Imported ${rows.length} compan${rows.length === 1 ? "y" : "ies"}${
        records.length > rows.length
          ? ` · skipped ${records.length - rows.length} row(s) with no company name`
          : ""
      }.`,
    };
  } catch (error) {
    console.error("[admin/companies] import failed:", error);
    return { status: "error", message: "Could not save those companies." };
  }
}
