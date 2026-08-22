import { expect, test } from "@playwright/test";
import { signInAsStudent } from "./support/clerk";

/**
 * The registration form's static contract: required fields, labels, and the
 * submit-gate on resume upload.
 *
 * These sign in first. Registration is behind an account now, so an anonymous
 * visit never reaches the form at all — that redirect is covered separately in
 * `registration-auth.spec.ts`, and asserting it again here would only mean
 * these tests silently stopped inspecting the form.
 *
 * What this suite deliberately does NOT cover: actually submitting the form.
 * That needs Vercel Blob (for the resume upload) and a database (for the
 * insert) — see README § "Required before the app can persist anything".
 * Full submission belongs in a separate suite gated on those being
 * configured, not here.
 */

test.describe("registration form", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsStudent(page);
    await page.goto("/register");
    // Guard the guard: if the session did not carry, every assertion below
    // would be evaluated against the sign-in page and fail for the wrong
    // reason.
    await expect(page).toHaveURL(/\/register$/);
  });

  test("required fields are marked required and labelled", async ({
    page,
  }) => {
    for (const label of [
      "Full name",
      "Mobile number",
      "CGPA",
      "Programme",
      "Branch",
      "Year",
    ]) {
      const field = page.getByLabel(label, { exact: false });
      await expect(field).toBeVisible();
      await expect(field).toHaveAttribute("required", "");
    }
  });

  test("the email comes from the account and cannot be typed", async ({
    page,
  }) => {
    // The whole point of gating registration is that the address is verified
    // rather than entered. An editable email input anywhere on this form —
    // even a hidden one — would hand that back to the browser, so assert the
    // absence as well as the display.
    await expect(page.getByText("From the account you signed in with")).toBeVisible();
    await expect(page.locator('input[name="email"]')).toHaveCount(0);
  });

  test("focus area is a required radiogroup, not a free skip", async ({
    page,
  }) => {
    const group = page.getByRole("radiogroup", { name: "Focus area" });
    await expect(group).toBeVisible();

    const options = group.getByRole("radio");
    await expect(options).toHaveCount(4); // core_dev, aiml, robotics, other
    for (const option of await options.all()) {
      await expect(option).toHaveAttribute("required", "");
    }
  });

  test("submit stays disabled until a resume is attached", async ({
    page,
  }) => {
    const submit = page.getByRole("button", { name: /submit application/i });
    await expect(submit).toBeDisabled();

    // Filling every other field must not be enough on its own — the resume
    // gate is independent of the rest of the form's completeness.
    await page.getByLabel("Full name").fill("Test Candidate");
    await page.getByLabel("Mobile number").fill("9876543210");
    await expect(submit).toBeDisabled();
  });

  test("the consent checkbox states what it consents to, not a generic label", async ({
    page,
  }) => {
    await expect(
      page.getByText(/every access to it is logged/i),
    ).toBeVisible();
  });

  // Moved here from the public-site heading-structure sweep. Anonymously,
  // /register redirects, so that sweep was checking the sign-in page's
  // heading and reporting it as /register's.
  test("has no obvious accessibility violations in heading structure", async ({
    page,
  }) => {
    await expect(page.locator("h1")).toHaveCount(1);
  });
});
