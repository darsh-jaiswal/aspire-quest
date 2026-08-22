import { expect, test } from "@playwright/test";

/**
 * Registration requires an account; browsing never does. The second half
 * matters as much as the first — forcing sign-in on a marketing page would
 * cost real applicants.
 */
test("an anonymous visitor is sent to sign-in from registration", async ({
  page,
}) => {
  await page.goto("/register");
  await expect(page).toHaveURL(/\/sign-in/);
});

test("an anonymous visitor can still browse the public site", async ({
  page,
}) => {
  for (const path of ["/", "/partners", "/alumni"]) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${path === "/" ? "/$" : path}`));
  }
});
