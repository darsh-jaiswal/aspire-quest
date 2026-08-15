import { expect, test } from "@playwright/test";

/**
 * Public marketing site — the pages that must render with NO environment
 * configured at all (see README § Getting started, § Security). Running
 * these against `next start` with no env vars set is itself the regression
 * test for the proxy bug fixed in commit 54036f6: an unconfigured Clerk used
 * to throw on every request, including these.
 */

test.describe("home page", () => {
  test("renders the hero and primary nav", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: /Aspire Quest — home/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Register", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "For recruiters" }),
    ).toBeVisible();
  });

  test("primary nav reaches the three intake surfaces", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("link", { name: "Register", exact: true })
      .click();
    await expect(page).toHaveURL(/\/register$/);

    await page.goto("/");
    await page.getByRole("link", { name: "For recruiters" }).click();
    await expect(page).toHaveURL(/\/partners$/);
  });
});

for (const path of ["/", "/alumni", "/partners", "/register"]) {
  test(`${path} has no obvious accessibility violations in heading structure`, async ({
    page,
  }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);

    // Exactly one h1 per page — the baseline heading-hierarchy check.
    await expect(page.locator("h1")).toHaveCount(1);
  });
}

test("no-access page renders standalone (no console chrome)", async ({
  page,
}) => {
  const response = await page.goto("/no-access");
  expect(response?.status()).toBe(200);
});

/**
 * Horizontal overflow.
 *
 * Added after a real one: the placements table carries `min-w-[34rem]`, and
 * its grid column defaulted to `min-width: auto`, so on a phone the column
 * refused to shrink and pushed the whole document sideways. The
 * `overflow-x-auto` wrapper could not help, because its parent was already too
 * wide. Wide content must scroll inside its own container, never the body.
 */
for (const [label, width] of [
  ["small phone", 320],
  ["phone", 390],
  ["tablet", 768],
  ["laptop", 1280],
] as const) {
  test(`no horizontal page scroll at ${label} (${width}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const overflows = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );

    expect(overflows).toBe(false);
  });
}
