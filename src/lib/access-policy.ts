/**
 * Access policy — pure functions, no I/O.
 *
 * The recruiter-isolation rule is the single most important invariant in this
 * application: a recruiter must never be able to read a candidate belonging to
 * another company. Keeping the decision here, free of Clerk and the database,
 * means it can be tested exhaustively rather than reasoned about.
 *
 * Callers supply the facts (who is asking, which companies the resource
 * belongs to); this module decides. It never fetches anything itself.
 */

export type Role = "admin" | "recruiter";

export type PolicyActor = {
  role: Role;
  /** Companies this actor is a member of. Always empty for admins. */
  companyIds: readonly number[];
};

/** May this actor act on behalf of `companyId`? */
export function canActForCompany(
  actor: PolicyActor,
  companyId: number,
): boolean {
  if (actor.role === "admin") return true;
  return actor.companyIds.includes(companyId);
}

/**
 * May this actor read a student's resume?
 *
 * `permittedCompanyIds` is the set of companies whose RELEASED bundles contain
 * that student. An empty set means nobody but an admin may read it — which is
 * the correct answer for a candidate who has been registered but not yet
 * shortlisted into any released bundle.
 */
export function canReadStudentResume(
  actor: PolicyActor,
  permittedCompanyIds: readonly number[],
): boolean {
  if (actor.role === "admin") return true;
  if (actor.companyIds.length === 0) return false;
  return permittedCompanyIds.some((id) => actor.companyIds.includes(id));
}

/** May this actor see a bundle at all? Drafts are admin-only, always. */
export function canViewBundle(
  actor: PolicyActor,
  bundle: { companyId: number; releasedAt: Date | null },
): boolean {
  if (actor.role === "admin") return true;
  if (!bundle.releasedAt) return false;
  return actor.companyIds.includes(bundle.companyId);
}
