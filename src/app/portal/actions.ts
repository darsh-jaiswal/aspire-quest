"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { getBundleCompanyIfReleased } from "@/db/queries/portal";
import { bundleStudents } from "@/db/schema";
import { canViewBundle } from "@/lib/access-policy";
import { requireRecruiter } from "@/lib/auth";
import { parseInterest } from "@/lib/interest";

/**
 * Recruiter annotations — the only writes an external party can make.
 *
 * Both actions follow the same shape, and the order matters:
 *
 *   1. `requireRecruiter()` — authenticate, and reject admins too. This surface
 *      belongs to recruiters; an admin annotating on a company's behalf would
 *      corrupt the meaning of the flag.
 *   2. Re-read the bundle's company and release state FROM THE DATABASE. The
 *      form carries a bundle id and nothing else that matters; company
 *      authority is never taken from client input.
 *   3. Decide with `canViewBundle`, the same tested policy the read path uses.
 *   4. Scope the UPDATE by (bundleId, studentId) so a student id belonging to
 *      another bundle cannot be annotated by substituting it into the form.
 *
 * A withdrawn bundle (`releasedAt` set back to null) stops accepting writes
 * immediately, because step 3 re-evaluates it on every call.
 */

export type PortalActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

const targetSchema = z.object({
  bundleId: z.coerce.number().int().positive(),
  studentId: z.coerce.number().int().positive(),
});

const noteSchema = z.object({
  note: z
    .string()
    .trim()
    .max(1000, "Keep the note under 1000 characters.")
    // An empty box means "clear the note", not "store an empty string".
    .transform((value) => (value.length === 0 ? null : value)),
});

/**
 * Resolve the bundle the caller is allowed to write to, or an error state.
 * Returns the company id so the caller can revalidate precisely.
 */
async function authoriseBundleWrite(
  bundleId: number,
): Promise<
  { ok: true; companyId: number } | { ok: false; state: PortalActionState }
> {
  const actor = await requireRecruiter();
  const bundle = await getBundleCompanyIfReleased(bundleId);

  // Same answer whether the bundle is missing, a draft, or another company's.
  if (!bundle || !canViewBundle(actor, bundle)) {
    return {
      ok: false,
      state: { status: "error", message: "That bundle is not available." },
    };
  }

  return { ok: true, companyId: bundle.companyId };
}

/** Mark a candidate as interesting, or pass on them. */
export async function setCandidateInterest(
  _prev: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const target = targetSchema.safeParse({
    bundleId: formData.get("bundleId"),
    studentId: formData.get("studentId"),
  });

  if (!target.success) {
    return { status: "error", message: "Could not read that request." };
  }

  // Three states, so this cannot be a checkbox: yes, no, and not yet reviewed.
  const interested = parseInterest(formData.get("interested"));

  const authorised = await authoriseBundleWrite(target.data.bundleId);
  if (!authorised.ok) return authorised.state;

  try {
    const [updated] = await db
      .update(bundleStudents)
      .set({ interested })
      .where(
        and(
          eq(bundleStudents.bundleId, target.data.bundleId),
          eq(bundleStudents.studentId, target.data.studentId),
        ),
      )
      .returning({ studentId: bundleStudents.studentId });

    if (!updated) {
      return { status: "error", message: "That candidate is not in this set." };
    }

    revalidatePath(`/portal/bundles/${target.data.bundleId}`);
    revalidatePath("/portal");

    return {
      status: "success",
      message:
        interested === true
          ? "Marked as interested."
          : interested === false
            ? "Passed."
            : "Cleared.",
    };
  } catch (error) {
    console.error("[portal] interest update failed:", error);
    return { status: "error", message: "Could not save that." };
  }
}

/** Leave or clear a private note against a candidate. */
export async function saveCandidateNote(
  _prev: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const target = targetSchema.safeParse({
    bundleId: formData.get("bundleId"),
    studentId: formData.get("studentId"),
  });

  if (!target.success) {
    return { status: "error", message: "Could not read that request." };
  }

  const note = noteSchema.safeParse({ note: formData.get("note") ?? "" });
  if (!note.success) {
    return { status: "error", message: note.error.issues[0]!.message };
  }

  const authorised = await authoriseBundleWrite(target.data.bundleId);
  if (!authorised.ok) return authorised.state;

  try {
    const [updated] = await db
      .update(bundleStudents)
      .set({ recruiterNote: note.data.note })
      .where(
        and(
          eq(bundleStudents.bundleId, target.data.bundleId),
          eq(bundleStudents.studentId, target.data.studentId),
        ),
      )
      .returning({ studentId: bundleStudents.studentId });

    if (!updated) {
      return { status: "error", message: "That candidate is not in this set." };
    }

    revalidatePath(`/portal/bundles/${target.data.bundleId}`);

    return {
      status: "success",
      message: note.data.note ? "Note saved." : "Note cleared.",
    };
  } catch (error) {
    console.error("[portal] note update failed:", error);
    return { status: "error", message: "Could not save that note." };
  }
}
