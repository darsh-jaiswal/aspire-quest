import { expect, test } from "@playwright/test";

/**
 * /admin and /portal with NO Clerk keys configured.
 *
 * README, § Console access: "Without Clerk keys every /admin route returns
 * 500 rather than rendering. That is the intended failure direction; it is
 * not a bug." This test turns that sentence into something that breaks CI if
 * it ever stops being true — e.g. a future refactor that accidentally lets an
 * unauthenticated request through instead of failing closed.
 *
 * This suite intentionally runs with no DATABASE_URL / Clerk env present. If
 * that ever changes in CI, these two tests are the ones to revisit first —
 * they assert the NO-ENV failure mode, not the authenticated one.
 */

for (const path of ["/admin", "/portal"]) {
  test(`${path} fails closed (never renders) with no auth configured`, async ({
    page,
  }) => {
    const response = await page.goto(path);

    // The one outcome that must never happen: a 200 with console content.
    expect(response?.status()).not.toBe(200);
    await expect(
      page.getByRole("heading", { name: /overview|candidate sets/i }),
    ).toHaveCount(0);
  });
}

test("resume download requires auth even for a well-formed request", async ({
  request,
}) => {
  const response = await request.get("/api/resume/download?studentId=1", {
    maxRedirects: 0,
  });

  // Either redirected to sign-in (3xx) or hard-failed (5xx with no env) —
  // never a 200 serving bytes.
  expect(response.status()).not.toBe(200);
});
