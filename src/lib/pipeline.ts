/**
 * Pipeline vocabulary shared by server queries and client components.
 *
 * These live here, not in `src/db/queries/*`, because those modules are
 * `server-only` — a client component that needs a status label must not be
 * able to drag a database client into the browser bundle with it.
 */

export type CompanyStatus =
  | "lead"
  | "contacted"
  | "interested"
  | "committed"
  | "onboarded";

export const COMPANY_STATUSES: readonly CompanyStatus[] = [
  "lead",
  "contacted",
  "interested",
  "committed",
  "onboarded",
];

export const COMPANY_STATUS_LABEL: Record<CompanyStatus, string> = {
  lead: "Lead",
  contacted: "Contacted",
  interested: "Interested",
  committed: "Committed",
  onboarded: "Onboarded",
};

export const COMPANY_SOURCE_LABEL: Record<string, string> = {
  self_serve: "Applied directly",
  alumni_referral: "Alumni referral",
  placement_cell: "Placement Cell",
  research: "Research",
};

export type StudentStatus =
  | "registered"
  | "screened"
  | "shortlisted"
  | "interviewed"
  | "selected"
  | "rejected";

export const STUDENT_STATUS_LABEL: Record<StudentStatus, string> = {
  registered: "Registered",
  screened: "Screened",
  shortlisted: "Shortlisted",
  interviewed: "Interviewed",
  selected: "Selected",
  rejected: "Not progressed",
};
