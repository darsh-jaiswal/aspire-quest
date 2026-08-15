import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bundleStudents, bundles, companies, students } from "@/db/schema";

/**
 * Bundle reads.
 *
 * `listBundlesForCompany` is the recruiter-facing entry point and takes the
 * company id as a REQUIRED argument rather than reading it from a session —
 * the caller must have run `assertCompanyAccess` first. There is deliberately
 * no "list all bundles" function that a recruiter path could reach.
 */

export async function listBundles() {
  return db
    .select({
      id: bundles.id,
      title: bundles.title,
      focusArea: bundles.focusArea,
      cgpaThreshold: bundles.cgpaThreshold,
      releasedAt: bundles.releasedAt,
      createdAt: bundles.createdAt,
      companyId: bundles.companyId,
      companyName: companies.name,
      size: sql<number>`(
        select count(*)::int from ${bundleStudents}
        where ${bundleStudents.bundleId} = ${bundles.id}
      )`,
    })
    .from(bundles)
    .innerJoin(companies, eq(bundles.companyId, companies.id))
    .orderBy(desc(bundles.createdAt));
}

/** Recruiter-facing. Released bundles only — drafts are invisible outside admin. */
export async function listBundlesForCompany(companyId: number) {
  return db
    .select({
      id: bundles.id,
      title: bundles.title,
      focusArea: bundles.focusArea,
      releasedAt: bundles.releasedAt,
      size: sql<number>`(
        select count(*)::int from ${bundleStudents}
        where ${bundleStudents.bundleId} = ${bundles.id}
      )`,
    })
    .from(bundles)
    .where(
      and(
        eq(bundles.companyId, companyId),
        sql`${bundles.releasedAt} is not null`,
      ),
    )
    .orderBy(desc(bundles.releasedAt));
}

export async function getBundle(id: number) {
  const [row] = await db
    .select({
      id: bundles.id,
      title: bundles.title,
      focusArea: bundles.focusArea,
      cgpaThreshold: bundles.cgpaThreshold,
      releasedAt: bundles.releasedAt,
      createdAt: bundles.createdAt,
      companyId: bundles.companyId,
      companyName: companies.name,
    })
    .from(bundles)
    .innerJoin(companies, eq(bundles.companyId, companies.id))
    .where(eq(bundles.id, id))
    .limit(1);
  return row ?? null;
}

/** Candidate rows in a bundle. Excludes phone — recruiters do not need it. */
export async function getBundleMembers(bundleId: number) {
  return db
    .select({
      studentId: students.id,
      refCode: students.refCode,
      fullName: students.fullName,
      email: students.email,
      branch: students.branch,
      programme: students.programme,
      year: students.year,
      cgpa: students.cgpa,
      focusArea: students.focusArea,
      skills: students.skills,
      status: students.status,
      resumeBlobKey: students.resumeBlobKey,
      interested: bundleStudents.interested,
      recruiterNote: bundleStudents.recruiterNote,
    })
    .from(bundleStudents)
    .innerJoin(students, eq(bundleStudents.studentId, students.id))
    .where(eq(bundleStudents.bundleId, bundleId))
    .orderBy(desc(students.cgpa));
}

/**
 * Which bundle a student sits in, used to authorise a resume download.
 * Returns the company ids that may legitimately read this student's resume.
 */
export async function companiesWithAccessToStudent(
  studentId: number,
): Promise<number[]> {
  const rows = await db
    .select({ companyId: bundles.companyId })
    .from(bundleStudents)
    .innerJoin(bundles, eq(bundleStudents.bundleId, bundles.id))
    .where(
      and(
        eq(bundleStudents.studentId, studentId),
        sql`${bundles.releasedAt} is not null`,
      ),
    );
  return [...new Set(rows.map((r) => r.companyId))];
}
