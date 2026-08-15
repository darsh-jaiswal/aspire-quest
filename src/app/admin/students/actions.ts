"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { bundleStudents, bundles } from "@/db/schema";
import { setStudentStatus } from "@/db/queries/students";
import { AuthorizationError, requireAdmin } from "@/lib/auth";
import { recordBulkAudit } from "@/lib/audit";

export type BulkState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

const idList = z
  .array(z.coerce.number().int().positive())
  .min(1, "Select at least one candidate.")
  .max(500, "Select fewer than 500 candidates at a time.");

const statusSchema = z.enum([
  "registered",
  "screened",
  "shortlisted",
  "interviewed",
  "selected",
  "rejected",
]);

/** Bulk status change from the screening table. */
export async function updateStatuses(
  _prev: BulkState,
  formData: FormData,
): Promise<BulkState> {
  const actor = await requireAdmin();

  const parsedIds = idList.safeParse(formData.getAll("studentIds"));
  if (!parsedIds.success) {
    return { status: "error", message: parsedIds.error.issues[0]!.message };
  }

  const parsedStatus = statusSchema.safeParse(formData.get("status"));
  if (!parsedStatus.success) {
    return { status: "error", message: "Pick a status to apply." };
  }

  try {
    const count = await setStudentStatus(parsedIds.data, parsedStatus.data);
    await recordBulkAudit(
      actor,
      "view_student",
      count,
      `Set status to ${parsedStatus.data}`,
    );

    revalidatePath("/admin/students");
    revalidatePath("/admin");

    return {
      status: "success",
      message: `${count} candidate${count === 1 ? "" : "s"} marked ${parsedStatus.data}.`,
    };
  } catch (error) {
    console.error("[admin/students] status update failed:", error);
    return { status: "error", message: "Could not update those candidates." };
  }
}

/** Add the current selection to an existing bundle. */
export async function addToBundle(
  _prev: BulkState,
  formData: FormData,
): Promise<BulkState> {
  const actor = await requireAdmin();

  const parsedIds = idList.safeParse(formData.getAll("studentIds"));
  if (!parsedIds.success) {
    return { status: "error", message: parsedIds.error.issues[0]!.message };
  }

  const bundleId = z.coerce
    .number()
    .int()
    .positive()
    .safeParse(formData.get("bundleId"));
  if (!bundleId.success) {
    return { status: "error", message: "Pick a bundle." };
  }

  try {
    const [bundle] = await db
      .select({ id: bundles.id, companyId: bundles.companyId })
      .from(bundles)
      .where(eq(bundles.id, bundleId.data))
      .limit(1);

    if (!bundle) {
      return { status: "error", message: "That bundle no longer exists." };
    }

    // Already-present rows are skipped rather than erroring the whole batch.
    await db
      .insert(bundleStudents)
      .values(
        parsedIds.data.map((studentId) => ({
          bundleId: bundle.id,
          studentId,
        })),
      )
      .onConflictDoNothing();

    await recordBulkAudit(
      actor,
      "view_bundle",
      parsedIds.data.length,
      `Added to bundle #${bundle.id}`,
    );

    revalidatePath("/admin/bundles");
    revalidatePath(`/admin/bundles/${bundle.id}`);

    return {
      status: "success",
      message: `Added ${parsedIds.data.length} candidate${parsedIds.data.length === 1 ? "" : "s"} to the bundle.`,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { status: "error", message: error.message };
    }
    console.error("[admin/students] add to bundle failed:", error);
    return { status: "error", message: "Could not add to that bundle." };
  }
}
