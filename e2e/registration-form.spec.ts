import { expect, test } from "@playwright/test";

/**
 * The registration form's static contract: required fields, labels, and the
 * submit-gate on resume upload.
 *
 * What this suite deliberately does NOT cover: actually submitting the form.
 * That needs Vercel Blob (for the resume upload) and a database (for the
 * insert) — see README § "Required before the app can persist anything".
 * Full submission belongs in a separate suite gated on those being
 * configured, not here.
 */

test.describe("registration form", () => {
  test("required fields are marked required and labelled", async ({
    page,
  }) => {
    await page.goto("/register");

    for (const label of [
      "Full name",
      "Email",
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

  test("focus area is a required radiogroup, not a free skip", async ({
    page,
  }) => {
    await page.goto("/register");

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
    await page.goto("/register");

    const submit = page.getByRole("button", { name: /submit application/i });
    await expect(submit).toBeDisabled();

    // Filling every other field must not be enough on its own — the resume
    // gate is independent of the rest of the form's completeness.
    await page.getByLabel("Full name").fill("Test Candidate");
    await page.getByLabel("Email", { exact: false }).fill("test@example.com");
    await expect(submit).toBeDisabled();
  });

  test("the consent checkbox states what it consents to, not a generic label", async ({
    page,
  }) => {
    await page.goto("/register");

    await expect(
      page.getByText(/every access to it is logged/i),
    ).toBeVisible();
  });
});
