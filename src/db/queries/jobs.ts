import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { companies, jobApplications, jobOpenings, students } from "@/db/schema";

/**
 * Student-facing reads for the jobs board.
 *
 * THE CONTRACT OF THIS FILE: nothing here ever selects `screeningPrompt`,
 * AI scores, rationales, or recruiter interest marks. Those columns are
 * recruiter/organiser material; a student-reachable code path must not be
 * able to return them even by accident. Add a field here only if a student
 * may see it.
 */

export type PublicOpening = {
  id: number;
  title: string;
  companyName: string;
  focusArea: "core_dev" | "aiml" | "robotics" | "other";
  description: string;
  skills: string[];
  minCgpa: string | null;
  eligibleBranches: string[];
  hasJd: boolean;
  status: "live" | "closed";
  publishedAt: Date | null;
};

const PUBLIC_OPENING_FIELDS = {
  id: jobOpenings.id,
  title: jobOpenings.title,
  companyName: companies.name,
  focusArea: jobOpenings.focusArea,
  description: jobOpenings.description,
  skills: jobOpenings.skills,
  minCgpa: jobOpenings.minCgpa,
  eligibleBranches: jobOpenings.eligibleBranches,
  hasJd: sql<boolean>`${jobOpenings.jdBlobKey} is not null`,
  status: sql<"live" | "closed">`${jobOpenings.status}`,
  publishedAt: jobOpenings.publishedAt,
};

/** Every live opening, newest first. Drafts and closed openings never appear. */
export async function listLiveOpenings(): Promise<PublicOpening[]> {
  return db
    .select(PUBLIC_OPENING_FIELDS)
    .from(jobOpenings)
    .innerJoin(companies, eq(jobOpenings.companyId, companies.id))
    .where(eq(jobOpenings.status, "live"))
    .orderBy(desc(jobOpenings.publishedAt));
}

/**
 * One opening for the public detail page. Live and closed openings render
 * (closed shows "applications closed" — the posting was public knowledge);
 * a draft is indistinguishable from nothing.
 */
export async function getPublicOpening(
  openingId: number,
): Promise<PublicOpening | null> {
  const [row] = await db
    .select(PUBLIC_OPENING_FIELDS)
    .from(jobOpenings)
    .innerJoin(companies, eq(jobOpenings.companyId, companies.id))
    .where(
      and(
        eq(jobOpenings.id, openingId),
        sql`${jobOpenings.status} in ('live', 'closed')`,
      ),
    )
    .limit(1);

  return row ?? null;
}

/**
 * The signed-in account's registered-and-paid student row, or null.
 *
 * Paid is the bar for applying: a pending_payment row is a started form, not
 * a registration — the same line the rest of the platform draws.
 */
export async function getPaidStudentByClerkId(
  clerkUserId: string,
): Promise<{ id: number; cgpa: string; branch: string } | null> {
  const [row] = await db
    .select({ id: students.id, cgpa: students.cgpa, branch: students.branch })
    .from(students)
    .where(
      and(
        eq(students.clerkUserId, clerkUserId),
        eq(students.paymentStatus, "paid"),
      ),
    )
    .limit(1);

  return row ?? null;
}

export type StudentApplication = {
  openingId: number;
  title: string;
  companyName: string;
  openingStatus: "draft" | "live" | "closed";
  appliedAt: Date;
};

/**
 * The student's own applications, newest first. Deliberately carries no
 * score and no interest mark — a student never learns they were "passed"
 * from a status page.
 */
export async function listApplicationsForStudent(
  studentId: number,
): Promise<StudentApplication[]> {
  return db
    .select({
      openingId: jobApplications.openingId,
      title: jobOpenings.title,
      companyName: companies.name,
      openingStatus: jobOpenings.status,
      appliedAt: jobApplications.appliedAt,
    })
    .from(jobApplications)
    .innerJoin(jobOpenings, eq(jobApplications.openingId, jobOpenings.id))
    .innerJoin(companies, eq(jobOpenings.companyId, companies.id))
    .where(eq(jobApplications.studentId, studentId))
    .orderBy(desc(jobApplications.appliedAt));
}

/** Whether this student already applied to this opening. */
export async function hasApplied(
  openingId: number,
  studentId: number,
): Promise<Date | null> {
  const [row] = await db
    .select({ appliedAt: jobApplications.appliedAt })
    .from(jobApplications)
    .where(
      and(
        eq(jobApplications.openingId, openingId),
        eq(jobApplications.studentId, studentId),
      ),
    )
    .limit(1);

  return row?.appliedAt ?? null;
}

/** JD file metadata for the download route's own authorization decision. */
export async function getOpeningJdMeta(openingId: number): Promise<{
  companyId: number;
  status: "draft" | "live" | "closed";
  jdBlobKey: string | null;
  jdContentType: string | null;
} | null> {
  const [row] = await db
    .select({
      companyId: jobOpenings.companyId,
      status: jobOpenings.status,
      jdBlobKey: jobOpenings.jdBlobKey,
      jdContentType: jobOpenings.jdContentType,
    })
    .from(jobOpenings)
    .where(eq(jobOpenings.id, openingId))
    .limit(1);

  return row ?? null;
}
