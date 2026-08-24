"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import {
  getPaidStudentByClerkId,
  getPublicOpening,
} from "@/db/queries/jobs";
import { getActiveResume } from "@/db/queries/resumes";
import { jobApplications } from "@/db/schema";
import { requireStudent } from "@/lib/auth";
import { checkEligibility } from "@/lib/openings";

/**
 * Applying — the one write a student can make on the jobs board.
 *
 * The disabled Apply button is courtesy; THIS is the enforcement point.
 * Everything is re-checked here against the database: signed in, registered
 * and paid, opening live, CGPA floor, branch list. The (opening, student)
 * primary key makes a duplicate apply structurally impossible, so a retry or
 * double-click converges on "you have applied" rather than an error.
 *
 * Applying is also the student's act of sharing: it is what grants the
 * opening's company resume-read standing (see the resume download route).
 */

export type ApplyState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "applied" };

const targetSchema = z.object({
  openingId: z.coerce.number().int().positive(),
  resumeId: z.coerce.number().int().positive(),
});

export async function applyToOpening(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const actor = await requireStudent();

  const target = targetSchema.safeParse({
    openingId: formData.get("openingId"),
    resumeId: formData.get("resumeId"),
  });
  if (!target.success) {
    return { status: "error", message: "Could not read that request." };
  }

  const student = await getPaidStudentByClerkId(actor.userId);
  if (!student) {
    return {
      status: "error",
      message:
        "Complete your Aspire Quest registration first — your application uses the profile and resume from it.",
    };
  }

  const opening = await getPublicOpening(target.data.openingId);
  if (!opening || opening.status !== "live") {
    return {
      status: "error",
      message: "This opening is not accepting applications.",
    };
  }

  const eligibility = checkEligibility(opening, student);
  if (!eligibility.eligible) {
    return { status: "error", message: eligibility.reason };
  }

  // The chosen CV must be the caller's own, and still active. A concurrent
  // soft-delete between this read and the insert is harmless: the snapshot
  // is allowed to point at a soft-deleted entry — that is what "snapshot"
  // means — and the orphan sweep spares any blob an application references.
  const resume = await getActiveResume(student.id, target.data.resumeId);
  if (!resume) {
    return {
      status: "error",
      message: "That resume is no longer in your library. Pick another one.",
    };
  }

  try {
    await db
      .insert(jobApplications)
      .values({
        openingId: opening.id,
        studentId: student.id,
        resumeId: resume.id,
      })
      .onConflictDoNothing();
  } catch (error) {
    console.error("[jobs] apply failed:", error);
    return {
      status: "error",
      message: "Something went wrong. Please try again in a moment.",
    };
  }

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${opening.id}`);
  return { status: "applied" };
}
