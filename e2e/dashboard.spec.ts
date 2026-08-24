import { expect, test } from "@playwright/test";
import {
  signInAsStudent,
  TEST_PAID_STUDENT_EMAIL,
  TEST_STUDENT_EMAIL,
} from "./support/clerk";
import { clerkUserIdFor, sqlClient } from "./support/seed";

/**
 * The student dashboard: the durable home for a registration. Three states
 * matter — signed out (never renders), no row (register prompt), and paid
 * (reference code, status, profile). The paid state is seeded directly,
 * which is why this suite has its own Clerk account (TEST_PAID_STUDENT_EMAIL):
 * the blank-form account must stay row-less and the prefill account's row
 * must stay pending_payment, and suites run in parallel workers.
 *
 * Serial: every test after the seed reads the same row; parallel workers
 * would each re-run beforeAll's delete+insert underneath one another.
 */

test.describe.configure({ mode: "serial" });

const SEEDED = {
  fullName: "Paid Tester",
  phone: "9876505678",
  cgpa: "7.42",
  programme: "B.Tech",
  branch: "CS",
  year: "3rd year",
  focusArea: "core_dev",
  skills: "{TypeScript,SQL}",
  resumeBlobKey: "resumes/e2e-paid-fixture.pdf",
  resumeFilename: "paid-resume.pdf",
  resumeBytes: 23_456,
  refCode: "AQ-E2EPAID",
};

test.describe("student dashboard", () => {
  let clerkUserId: string;

  test.beforeAll(async () => {
    clerkUserId = await clerkUserIdFor(TEST_PAID_STUDENT_EMAIL);
    const sql = sqlClient();
    // Idempotent: a crashed run leaves a PAID row, which no sweep cron
    // touches — this delete is the only cleanup path, so it runs first.
    await sql`
      DELETE FROM students
      WHERE clerk_user_id = ${clerkUserId}
        OR email = ${TEST_PAID_STUDENT_EMAIL}
        OR ref_code = ${SEEDED.refCode}
    `;
    await sql`
      INSERT INTO students (
        clerk_user_id, full_name, email, phone, branch, programme, year,
        cgpa, focus_area, skills, resume_blob_key, resume_filename,
        resume_bytes, consent_at, payment_status, ref_code, paid_at
      ) VALUES (
        ${clerkUserId}, ${SEEDED.fullName}, ${TEST_PAID_STUDENT_EMAIL},
        ${SEEDED.phone}, ${SEEDED.branch}, ${SEEDED.programme}, ${SEEDED.year},
        ${SEEDED.cgpa}, ${SEEDED.focusArea}, ${SEEDED.skills}::text[],
        ${SEEDED.resumeBlobKey}, ${SEEDED.resumeFilename}, ${SEEDED.resumeBytes},
        now(), 'paid', ${SEEDED.refCode}, now()
      )
    `;
  });

  test.afterAll(async () => {
    await sqlClient()`
      DELETE FROM students WHERE clerk_user_id = ${clerkUserId}
    `;
  });

  test("never renders application content to a signed-out visitor", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page.getByText(SEEDED.refCode)).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: /your application/i }),
    ).toHaveCount(0);
  });

  test("an account with no registration is prompted to register", async ({
    page,
  }) => {
    await signInAsStudent(page, TEST_STUDENT_EMAIL);
    await page.goto("/dashboard");

    await expect(page.getByText(/you haven't registered yet/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /start your registration/i }),
    ).toBeVisible();
  });

  test("a paid student sees their reference code, status and profile", async ({
    page,
  }) => {
    await signInAsStudent(page, TEST_PAID_STUDENT_EMAIL);
    await page.goto("/dashboard");

    await expect(page.getByText(SEEDED.refCode)).toBeVisible();
    await expect(page.getByText("Under review")).toBeVisible();
    await expect(page.getByText(SEEDED.fullName)).toBeVisible();
    await expect(page.getByText(SEEDED.resumeFilename)).toBeVisible();

    // The header stops telling a registered student to register.
    await expect(
      page.getByRole("link", { name: /my application/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /^register$/i })).toHaveCount(0);
  });

  test("a paid student visiting /register lands on the dashboard", async ({
    page,
  }) => {
    await signInAsStudent(page, TEST_PAID_STUDENT_EMAIL);
    await page.goto("/register");

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(SEEDED.refCode)).toBeVisible();
  });

  test("no horizontal page scroll at small phone (320px)", async ({ page }) => {
    await signInAsStudent(page, TEST_PAID_STUDENT_EMAIL);
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/dashboard");
    await expect(page.getByText(SEEDED.refCode)).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
});
