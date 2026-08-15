import "server-only";

import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { bundleStudents, bundles, companies } from "@/db/schema";

/**
 * Recruiter-facing reads.
 *
 * Every function here takes the permitted company ids as a REQUIRED argument
 * and filters on `releasedAt is not null` in SQL. There is deliberately no
 * variant that reads a bundle by id alone — a recruiter path must never be able
 * to name a bundle and get it back without the company filter travelling with
 * the query. The isolation rule is enforced in the WHERE clause, not the UI.
 *
 * An empty `companyIds` short-circuits to an empty result rather than reaching
 * the database: a recruiter with no membership can read nothing, and building a
 * query with an empty IN list invites a dialect-specific surprise.
 */

export type PortalBundle = {
  id: number;
  title: string;
  focusArea: "core_dev" | "aiml" | "robotics" | "other";
  releasedAt: Date | null;
  companyId: number;
  companyName: string;
  size: number;
  reviewed: number;
};

/** Released bundles across every company this recruiter belongs to. */
export async function listReleasedBundlesForCompanies(
  companyIds: readonly number[],
): Promise<PortalBundle[]> {
  if (companyIds.length === 0) return [];

  return db
    .select({
      id: bundles.id,
      title: bundles.title,
      focusArea: bundles.focusArea,
      releasedAt: bundles.releasedAt,
      companyId: bundles.companyId,
      companyName: companies.name,
      size: sql<number>`(
        select count(*)::int from ${bundleStudents}
        where ${bundleStudents.bundleId} = ${bundles.id}
      )`,
      reviewed: sql<number>`(
        select count(*)::int from ${bundleStudents}
        where ${bundleStudents.bundleId} = ${bundles.id}
          and ${bundleStudents.interested} is not null
      )`,
    })
    .from(bundles)
    .innerJoin(companies, eq(bundles.companyId, companies.id))
    .where(
      and(
        inArray(bundles.companyId, [...companyIds]),
        isNotNull(bundles.releasedAt),
      ),
    )
    .orderBy(desc(bundles.releasedAt));
}

/**
 * A single released bundle, scoped to the caller's companies.
 *
 * Returns null both when the bundle does not exist and when it is not the
 * caller's to see — the caller cannot tell the two apart, which is the point.
 */
export async function getReleasedBundleForCompanies(
  bundleId: number,
  companyIds: readonly number[],
): Promise<PortalBundle | null> {
  if (companyIds.length === 0) return null;

  const [row] = await db
    .select({
      id: bundles.id,
      title: bundles.title,
      focusArea: bundles.focusArea,
      releasedAt: bundles.releasedAt,
      companyId: bundles.companyId,
      companyName: companies.name,
      size: sql<number>`(
        select count(*)::int from ${bundleStudents}
        where ${bundleStudents.bundleId} = ${bundles.id}
      )`,
      reviewed: sql<number>`(
        select count(*)::int from ${bundleStudents}
        where ${bundleStudents.bundleId} = ${bundles.id}
          and ${bundleStudents.interested} is not null
      )`,
    })
    .from(bundles)
    .innerJoin(companies, eq(bundles.companyId, companies.id))
    .where(
      and(
        eq(bundles.id, bundleId),
        inArray(bundles.companyId, [...companyIds]),
        isNotNull(bundles.releasedAt),
      ),
    )
    .limit(1);

  return row ?? null;
}

/**
 * The company ids a bundle may be annotated on behalf of.
 *
 * Used by the Server Actions to re-derive authority from the database rather
 * than trusting a company id that arrived in a form field.
 */
export async function getBundleCompanyIfReleased(
  bundleId: number,
): Promise<{ companyId: number; releasedAt: Date | null } | null> {
  const [row] = await db
    .select({ companyId: bundles.companyId, releasedAt: bundles.releasedAt })
    .from(bundles)
    .where(eq(bundles.id, bundleId))
    .limit(1);

  return row ?? null;
}
