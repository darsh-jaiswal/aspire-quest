import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import type { Page } from "@playwright/test";

/**
 * A signed-in student session for tests that need one.
 *
 * Registration is gated behind an account (see `src/proxy.ts`), so any test
 * that inspects the form itself has to authenticate first. Everything else in
 * this suite stays anonymous on purpose — browsing must never require a login.
 *
 * The address uses Clerk's `+clerk_test` convention, which makes the emailed
 * code a fixed value instead of a real inbox round-trip. The instance has
 * password disabled as a first factor (only `email_code` and Google), so this
 * is the one non-interactive strategy available to us.
 */
export const TEST_STUDENT_EMAIL = "aspire.quest.e2e+clerk_test@example.com";

export async function signInAsStudent(page: Page): Promise<void> {
  await setupClerkTestingToken({ page });

  // ClerkJS is mounted per-route rather than in the root layout (see
  // `src/app/admin/layout.tsx` for why), so `window.Clerk` does not exist on
  // the marketing pages. `/no-access` is the only unprotected route that
  // loads Clerk without also mounting <SignIn/>, which would race this call.
  await page.goto("/no-access");
  await clerk.loaded({ page });

  await clerk.signIn({
    page,
    signInParams: {
      strategy: "email_code",
      identifier: TEST_STUDENT_EMAIL,
    },
  });
}
