import "server-only";

import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  alumniReferrals,
  companies,
  outreachLog,
  problemStatements,
} from "@/db/schema";

// Status vocabulary and labels live in @/lib/pipeline so client components can
// use them without pulling this server-only module into the browser bundle.
import type { CompanyStatus } from "@/lib/pipeline";

export async function listCompanies() {
  return db.select().from(companies).orderBy(desc(companies.updatedAt));
}

export async function getCompany(id: number) {
  const [row] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, id))
    .limit(1);
  return row ?? null;
}

export async function companyStatusCounts(): Promise<
  Record<CompanyStatus, number>
> {
  const rows = await db
    .select({ status: companies.status, value: sql<number>`count(*)::int` })
    .from(companies)
    .groupBy(companies.status);

  const out: Record<CompanyStatus, number> = {
    lead: 0,
    contacted: 0,
    interested: 0,
    committed: 0,
    onboarded: 0,
  };
  for (const row of rows) out[row.status] = row.value;
  return out;
}

export async function getProblemStatements(companyId: number) {
  return db
    .select()
    .from(problemStatements)
    .where(eq(problemStatements.companyId, companyId))
    .orderBy(desc(problemStatements.createdAt));
}

export async function getOutreach(companyId: number) {
  return db
    .select()
    .from(outreachLog)
    .where(eq(outreachLog.companyId, companyId))
    .orderBy(desc(outreachLog.occurredAt));
}

export async function listAlumniReferrals() {
  return db
    .select()
    .from(alumniReferrals)
    .orderBy(desc(alumniReferrals.createdAt));
}

export async function countPendingReferrals(): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(alumniReferrals)
    .where(sql`${alumniReferrals.promotedCompanyId} is null`);
  return row?.value ?? 0;
}
