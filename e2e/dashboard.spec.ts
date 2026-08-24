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
    // The registration flow would have created the primary library entry;
    // seed the same shape. Deleting the student cascades this row.
    await sql`
      INSERT INTO resumes (student_id, blob_key, filename, bytes, is_primary)
      SELECT id, ${SEEDED.resumeBlobKey}, ${SEEDED.resumeFilename}, ${SEEDED.resumeBytes}, true
      FROM students WHERE clerk_user_id = ${clerkUserId}
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
    // The filename shows in both the profile list and the resume library;
    // scope to the profile region to stay strict-mode clean.
    await expect(
      page.getByLabel("Profile on record").getByText(SEEDED.resumeFilename),
    ).toBeVisible();

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

  test("the resume library adds, re-primaries and deletes a CV", async ({
    page,
  }) => {
    await signInAsStudent(page, TEST_PAID_STUDENT_EMAIL);
    await page.goto("/dashboard");

    // The profile list shows the primary's filename too, so every filename
    // assertion is scoped to the library section.
    const library = page.locator("section", { hasText: "Your resumes" });

    // Seeded state: one CV, primary, undeletable.
    await expect(library.getByText("1/3")).toBeVisible();
    await expect(library.getByText(SEEDED.resumeFilename)).toBeVisible();
    await expect(library.getByText("Primary", { exact: true })).toBeVisible();
    await expect(library.getByRole("button", { name: /^delete$/i })).toHaveCount(0);

    // Add a second CV through the real upload endpoint.
    await library.getByLabel(/upload another resume/i).setInputFiles({
      name: "second-cv.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 e2e second cv"),
    });
    await library.getByRole("button", { name: /add to library/i }).click();
    await expect(library.getByText("2/3")).toBeVisible();
    await expect(library.getByText("second-cv.pdf")).toBeVisible();

    // Promote it; the badge moves.
    await library.getByRole("button", { name: /make primary/i }).click();
    await expect(
      library
        .locator("li", { hasText: "second-cv.pdf" })
        .getByText("Primary", { exact: true }),
    ).toBeVisible();

    // The demoted original can now be deleted — two-step confirm.
    const originalRow = library.locator("li", { hasText: SEEDED.resumeFilename });
    await originalRow.getByRole("button", { name: /^delete$/i }).click();
    await originalRow.getByRole("button", { name: /confirm delete/i }).click();
    await expect(library.getByText("1/3")).toBeVisible();
    await expect(library.getByText(SEEDED.resumeFilename)).toHaveCount(0);
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
