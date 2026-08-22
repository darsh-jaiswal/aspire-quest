/**
 * Aspire Quest — database schema.
 *
 * Holds student PII (name, email, phone, CGPA) and resume pointers. Under the
 * DPDP Act, CGPA and phone are personal data; every read of a student row by
 * an admin or recruiter is written to `auditLog`. See src/db/README.md.
 */

import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------
 * Enums
 * ---------------------------------------------------------------------- */

export const focusAreaEnum = pgEnum("focus_area", [
  "core_dev",
  "aiml",
  "robotics",
  "other",
]);

export const studentStatusEnum = pgEnum("student_status", [
  "registered",
  "screened",
  "shortlisted",
  "interviewed",
  "selected",
  "rejected",
]);

export const companyStatusEnum = pgEnum("company_status", [
  "lead",
  "contacted",
  "interested",
  "committed",
  "onboarded",
]);

/** How a company entered the pipeline — drives which outreach play to run. */
export const companySourceEnum = pgEnum("company_source", [
  "self_serve",
  "alumni_referral",
  "placement_cell",
  "research",
]);

export const outreachChannelEnum = pgEnum("outreach_channel", [
  "email",
  "call",
  "linkedin",
  "meeting",
  "referral",
  "other",
]);

export const auditActionEnum = pgEnum("audit_action", [
  "view_student",
  "view_resume",
  "export_csv",
  "view_bundle",
]);

/* -------------------------------------------------------------------------
 * Students
 *
 * No accounts. A registration returns an on-screen `refCode`, which is how a
 * student is identified in any follow-up.
 * ---------------------------------------------------------------------- */

export const students = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),
    refCode: varchar("ref_code", { length: 12 }).notNull(),

    /**
     * The Clerk account that submitted this application.
     *
     * Nullable because rows created before accounts existed have none. Unique
     * so one account yields one application — this is the duplicate check,
     * replacing email, because an account id is stable and an email is typed.
     */
    clerkUserId: varchar("clerk_user_id", { length: 64 }),

    fullName: varchar("full_name", { length: 120 }).notNull(),
    email: varchar("email", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),

    branch: varchar("branch", { length: 16 }).notNull(),
    programme: varchar("programme", { length: 16 }).notNull(),
    year: varchar("year", { length: 16 }).notNull(),

    /** numeric(4,2) — 0.00 to 10.00. Never a float: CGPA is compared exactly. */
    cgpa: numeric("cgpa", { precision: 4, scale: 2 }).notNull(),

    focusArea: focusAreaEnum("focus_area").notNull(),
    skills: text("skills").array().notNull().default(sql`ARRAY[]::text[]`),

    /** Opaque key into the PRIVATE blob store. Never a public URL. */
    resumeBlobKey: text("resume_blob_key"),
    resumeFilename: varchar("resume_filename", { length: 200 }),
    resumeBytes: integer("resume_bytes"),

    status: studentStatusEnum("status").notNull().default("registered"),
    notes: text("notes"),

    /** Explicit, timestamped consent. Required before any bundle sharing. */
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),

    /** Set once the registration-confirmation email has been sent. */
    confirmationEmailSentAt: timestamp("confirmation_email_sent_at", {
      withTimezone: true,
    }),
    /**
     * How many of the pre-event reminder emails this student has received,
     * in order. The reminder cron only ever sends the next one — never
     * re-sends or skips ahead. See src/lib/reminders.ts.
     */
    remindersSent: integer("reminders_sent").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("students_ref_code_idx").on(table.refCode),
    uniqueIndex("students_email_idx").on(table.email),
    uniqueIndex("students_clerk_user_idx").on(table.clerkUserId),
    index("students_cgpa_idx").on(table.cgpa),
    index("students_branch_idx").on(table.branch),
    index("students_focus_area_idx").on(table.focusArea),
    index("students_status_idx").on(table.status),
  ],
);

/* -------------------------------------------------------------------------
 * Companies — the CRM pipeline
 * ---------------------------------------------------------------------- */

export const companies = pgTable(
  "companies",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    website: varchar("website", { length: 200 }),

    contactName: varchar("contact_name", { length: 120 }),
    contactEmail: varchar("contact_email", { length: 160 }),
    contactPhone: varchar("contact_phone", { length: 20 }),

    /** Monthly stipend floor in INR. Null when not yet discussed. */
    stipendMin: integer("stipend_min"),
    ppoTrack: boolean("ppo_track").notNull().default(false),

    status: companyStatusEnum("status").notNull().default("lead"),
    source: companySourceEnum("source").notNull().default("self_serve"),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("companies_status_idx").on(table.status),
    index("companies_source_idx").on(table.source),
  ],
);

/* -------------------------------------------------------------------------
 * Problem statements — what a partner's interviews are built around
 * ---------------------------------------------------------------------- */

export const problemStatements = pgTable(
  "problem_statements",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    focusArea: focusAreaEnum("focus_area").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("problem_statements_company_idx").on(table.companyId),
    index("problem_statements_focus_area_idx").on(table.focusArea),
  ],
);

/* -------------------------------------------------------------------------
 * Alumni referrals — promotes into a company lead
 * ---------------------------------------------------------------------- */

export const alumniReferrals = pgTable(
  "alumni_referrals",
  {
    id: serial("id").primaryKey(),
    alumName: varchar("alum_name", { length: 120 }).notNull(),
    batch: varchar("batch", { length: 16 }),
    branch: varchar("branch", { length: 16 }),
    company: varchar("company", { length: 160 }),
    role: varchar("role", { length: 120 }),
    email: varchar("email", { length: 160 }),
    linkedin: varchar("linkedin", { length: 200 }),
    hiringInterest: boolean("hiring_interest").notNull().default(false),
    notes: text("notes"),

    /** Set once this referral has been promoted into `companies`. */
    promotedCompanyId: integer("promoted_company_id").references(
      () => companies.id,
      { onDelete: "set null" },
    ),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("alumni_referrals_hiring_idx").on(table.hiringInterest),
    index("alumni_referrals_promoted_idx").on(table.promotedCompanyId),
  ],
);

/* -------------------------------------------------------------------------
 * Outreach log — pipeline history
 * ---------------------------------------------------------------------- */

export const outreachLog = pgTable(
  "outreach_log",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    /** Clerk user id of the organiser who logged this. */
    actor: varchar("actor", { length: 64 }).notNull(),
    channel: outreachChannelEnum("channel").notNull(),
    note: text("note").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("outreach_log_company_idx").on(table.companyId),
    index("outreach_log_occurred_idx").on(table.occurredAt),
  ],
);

/* -------------------------------------------------------------------------
 * Bundles — the focus-area candidate sets a recruiter actually receives
 * ---------------------------------------------------------------------- */

export const bundles = pgTable(
  "bundles",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    focusArea: focusAreaEnum("focus_area").notNull(),
    /** CGPA floor this bundle was built at, recorded for auditability. */
    cgpaThreshold: numeric("cgpa_threshold", { precision: 4, scale: 2 }),
    /** Null until an admin releases it; recruiters see released bundles only. */
    releasedAt: timestamp("released_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("bundles_company_idx").on(table.companyId),
    index("bundles_released_idx").on(table.releasedAt),
  ],
);

export const bundleStudents = pgTable(
  "bundle_students",
  {
    bundleId: integer("bundle_id")
      .notNull()
      .references(() => bundles.id, { onDelete: "cascade" }),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    /** Recruiter-set interest flag. Null = not yet reviewed. */
    interested: boolean("interested"),
    recruiterNote: text("recruiter_note"),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.bundleId, table.studentId] }),
    index("bundle_students_student_idx").on(table.studentId),
  ],
);

/* -------------------------------------------------------------------------
 * Audit log — every read of student PII
 * ---------------------------------------------------------------------- */

export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    /** Clerk user id. */
    actor: varchar("actor", { length: 64 }).notNull(),
    actorRole: varchar("actor_role", { length: 24 }).notNull(),
    action: auditActionEnum("action").notNull(),
    /** Target student, when the action concerns one. */
    studentId: integer("student_id").references(() => students.id, {
      onDelete: "set null",
    }),
    /** Company on whose behalf a recruiter acted. */
    companyId: integer("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    detail: text("detail"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_log_actor_idx").on(table.actor),
    index("audit_log_student_idx").on(table.studentId),
    index("audit_log_occurred_idx").on(table.occurredAt),
  ],
);

/* -------------------------------------------------------------------------
 * Recruiter ↔ company membership
 *
 * The authorisation spine: a recruiter may only ever read bundles belonging
 * to the company they are a member of. Enforced in the query, not the UI.
 * ---------------------------------------------------------------------- */

export const recruiterMemberships = pgTable(
  "recruiter_memberships",
  {
    id: serial("id").primaryKey(),
    /** Clerk user id. */
    userId: varchar("user_id", { length: 64 }).notNull(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    invitedBy: varchar("invited_by", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("recruiter_memberships_user_company_idx").on(
      table.userId,
      table.companyId,
    ),
    index("recruiter_memberships_user_idx").on(table.userId),
  ],
);

/* -------------------------------------------------------------------------
 * Relations
 * ---------------------------------------------------------------------- */

export const companiesRelations = relations(companies, ({ many }) => ({
  problemStatements: many(problemStatements),
  outreach: many(outreachLog),
  bundles: many(bundles),
  recruiters: many(recruiterMemberships),
}));

export const studentsRelations = relations(students, ({ many }) => ({
  bundleLinks: many(bundleStudents),
}));

export const bundlesRelations = relations(bundles, ({ one, many }) => ({
  company: one(companies, {
    fields: [bundles.companyId],
    references: [companies.id],
  }),
  students: many(bundleStudents),
}));

export const bundleStudentsRelations = relations(bundleStudents, ({ one }) => ({
  bundle: one(bundles, {
    fields: [bundleStudents.bundleId],
    references: [bundles.id],
  }),
  student: one(students, {
    fields: [bundleStudents.studentId],
    references: [students.id],
  }),
}));

export const problemStatementsRelations = relations(
  problemStatements,
  ({ one }) => ({
    company: one(companies, {
      fields: [problemStatements.companyId],
      references: [companies.id],
    }),
  }),
);

export const outreachLogRelations = relations(outreachLog, ({ one }) => ({
  company: one(companies, {
    fields: [outreachLog.companyId],
    references: [companies.id],
  }),
}));

export const recruiterMembershipsRelations = relations(
  recruiterMemberships,
  ({ one }) => ({
    company: one(companies, {
      fields: [recruiterMemberships.companyId],
      references: [companies.id],
    }),
  }),
);

/* -------------------------------------------------------------------------
 * Inferred types
 * ---------------------------------------------------------------------- */

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Bundle = typeof bundles.$inferSelect;
export type ProblemStatement = typeof problemStatements.$inferSelect;
export type AlumniReferral = typeof alumniReferrals.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;
