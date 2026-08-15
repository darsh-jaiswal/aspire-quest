"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { bundleStudents, bundles } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export type BundleActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

const createSchema = z.object({
  companyId: z.coerce.number().int().positive(),
  title: z.string().trim().min(3, "Give the bundle a title.").max(200),
  focusArea: z.enum(["core_dev", "aiml", "robotics", "other"]),
  cgpaThreshold: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || /^\d{1,2}(\.\d{1,2})?$/.test(v), {
      message: "CGPA floor must be a number, e.g. 6.50.",
    })
    .transform((v) => (v === undefined ? undefined : Number(v).toFixed(2))),
});

export async function createBundle(
  _prev: BundleActionState,
  formData: FormData,
): Promise<BundleActionState> {
  await requireAdmin();

  const parsed = createSchema.safeParse({
    companyId: formData.get("companyId"),
    title: formData.get("title"),
    focusArea: formData.get("focusArea"),
    cgpaThreshold: formData.get("cgpaThreshold") ?? "",
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]!.message };
  }

  try {
    await db.insert(bundles).values({
      companyId: parsed.data.companyId,
      title: parsed.data.title,
      focusArea: parsed.data.focusArea,
      cgpaThreshold: parsed.data.cgpaThreshold,
    });

    revalidatePath("/admin/bundles");
    return { status: "success", message: `Created “${parsed.data.title}”.` };
  } catch (error) {
    console.error("[admin/bundles] create failed:", error);
    return { status: "error", message: "Could not create that bundle." };
  }
}

/**
 * Release a bundle to its company.
 *
 * This is the moment student PII becomes visible to an external recruiter, so
 * it is an explicit, deliberate act rather than a side effect of adding
 * candidates. Until `releasedAt` is set, the recruiter portal cannot see the
 * bundle at all.
 */
export async function setBundleRelease(
  _prev: BundleActionState,
  formData: FormData,
): Promise<BundleActionState> {
  await requireAdmin();

  const bundleId = z.coerce
    .number()
    .int()
    .positive()
    .safeParse(formData.get("bundleId"));
  const release = formData.get("release") === "true";

  if (!bundleId.success) {
    return { status: "error", message: "Could not read that bundle." };
  }

  try {
    const [updated] = await db
      .update(bundles)
      .set({ releasedAt: release ? new Date() : null })
      .where(eq(bundles.id, bundleId.data))
      .returning({ id: bundles.id });

    if (!updated) {
      return { status: "error", message: "That bundle no longer exists." };
    }

    revalidatePath("/admin/bundles");
    revalidatePath(`/admin/bundles/${bundleId.data}`);

    return {
      status: "success",
      message: release
        ? "Released. The company's recruiters can now see these candidates."
        : "Withdrawn. The bundle is no longer visible to the company.",
    };
  } catch (error) {
    console.error("[admin/bundles] release failed:", error);
    return { status: "error", message: "Could not change that bundle." };
  }
}

export async function removeFromBundle(
  _prev: BundleActionState,
  formData: FormData,
): Promise<BundleActionState> {
  await requireAdmin();

  const bundleId = z.coerce
    .number()
    .int()
    .positive()
    .safeParse(formData.get("bundleId"));
  const studentId = z.coerce
    .number()
    .int()
    .positive()
    .safeParse(formData.get("studentId"));

  if (!bundleId.success || !studentId.success) {
    return { status: "error", message: "Could not read that request." };
  }

  try {
    await db
      .delete(bundleStudents)
      .where(
        and(
          eq(bundleStudents.bundleId, bundleId.data),
          eq(bundleStudents.studentId, studentId.data),
        ),
      );

    revalidatePath(`/admin/bundles/${bundleId.data}`);
    return { status: "success", message: "Removed from the bundle." };
  } catch (error) {
    console.error("[admin/bundles] remove failed:", error);
    return { status: "error", message: "Could not remove that candidate." };
  }
}
