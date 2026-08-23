@AGENTS.md

# Aspire Quest — working notes

**`README.md` is the source of truth** for architecture, security, design direction and project status. Read it before changing anything. These notes cover only what the README does not: live infrastructure state, and traps this codebase has already sprung.

## Content rule (non-negotiable)

`src/lib/content.ts` holds every public-facing fact, and **every figure in it is sourced**. Unknowns are modelled as `null` / `"TBA"` and the UI degrades. This site is official-adjacent to NMIMS and read by recruiters from Deloitte, Oracle and L&T — inventing a plausible-looking number is a credibility and compliance problem, not a cosmetic one. If you add a field, add its source. Write `₹` directly as UTF-8.

## Infrastructure — provisioned

| Service | State |
|---|---|
| GitHub | `darsh-jaiswal/aspire-quest`, private |
| Vercel | project `aspire-quest`, Git-connected — **every push to `main` auto-deploys to production** |
| Production | https://aspire-quest.vercel.app |
| Neon Postgres | `neon-erin-mountain`, schema pushed, all 11 tables live (added `payment_orders`, `payment_events` 2026-08-23) |
| Clerk | `clerk-cyan-fence`, keys set on all environments |
| Vercel Blob | store `aspire-quest-resumes` (`store_3Ko4xHah6HiO4TPW`), `BLOB_READ_WRITE_TOKEN` set on all environments — resume upload confirmed working via a live browser test 2026-08-21 |
| Upstash Redis | `UPSTASH_REDIS_REST_*` set on all environments — rate limiting no longer fails closed |
| Resend | domain `aspirequest.darshjaiswal.com` (DKIM+SPF verified 2026-08-21), `RESEND_API_KEY`/`RESEND_EMAIL_DOMAIN` set on all environments. Sends from `noreply@aspirequest.darshjaiswal.com` — a subdomain used only as a mail sender identity, unrelated to and not affecting the portfolio hosted at the bare `darshjaiswal.com` |

## Registration email

- **Confirmation email** sends on every successful registration (`src/app/register/actions.ts`), fire-and-safe via `waitUntil` so it survives after the response is returned. A send failure never fails the registration — the DB row is the real record, the email is a courtesy. See `src/lib/email.ts`.
- **Reminder emails** (`src/lib/reminders.ts`, cron at `src/app/api/cron/reminders/route.ts`, scheduled daily in `vercel.json`) send at 7/3/1 days before `EDITION.startsAt` (`src/lib/content.ts`). **This is a deliberate no-op while `EDITION.startsAt` is `null`** — Ambiora '27 dates aren't announced yet. Once an organiser sets a real date and redeploys, the cron picks up automatically; no other step needed. Protected by `CRON_SECRET` (set on all environments).
- Both use React Email templates in `src/emails/`. Idempotency keys prevent duplicate sends on retry.
- Resend free tier caps at 100 emails/day — accepted as a known risk for now per the organiser (a registration surge could hit this on confirmations alone). Revisit if it becomes a real problem.

## Registration payment (Stage 2, built 2026-08-23)

- **Razorpay is wired but not provisioned.** No account exists yet — `NEXT_PUBLIC_RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` are unset everywhere. With a fee configured (`REGISTRATION_FEE.amountPaise` in `src/lib/content.ts` — currently a real ₹100, a provisional figure the site owner set directly to unblock this build, not yet organiser-confirmed), registration fails closed with a clear "temporarily unavailable" message rather than accepting an application nobody can pay for. Set `amountPaise` back to `null` to keep registration free until Razorpay exists.
- **The checkout popup itself is unverified end-to-end.** Everything up to opening Razorpay Checkout is tested (order creation, the review screen, the CSP allowances for `checkout.razorpay.com` / `api.razorpay.com`) but the actual popup, a real payment, and the webhook firing for real have never run — there is no Razorpay account to test against. Once one exists with test-mode keys, do a full pass before any real money moves: register with a real card in test mode, confirm the webhook lands, confirm the reference code appears. The CSP allowances in particular are the commonly-documented set (`checkout.razorpay.com`, `api.razorpay.com`, `lumberjack.razorpay.com`) rather than something confirmed against Razorpay's own docs, which don't publish a definitive CSP allowlist — expect to adjust if the live popup hits a blocked resource.
- **Two new crons**, both protected by `CRON_SECRET` like the existing two: `payment-reconciliation` (daily, asks Razorpay directly about any order stuck non-terminal over an hour — the fallback for a webhook that never arrives) and `sweep-pending-registrations` (daily, deletes abandoned `pending_payment` rows older than 24h that never got as far as a payment attempt — a row with ANY payment order is kept permanently, on purpose, see `payment-flow-review.md` Defect 5).
- The webhook at `/api/payments/razorpay/webhook` is the only writer of `payment_status='paid'` — a single compare-and-swap `UPDATE ... WHERE payment_status='pending_payment'`, shared with the reconciliation cron via `src/lib/payment-settlement.ts`. Read `payment-flow-review.md` before touching this path; it records six real defects an earlier draft of this design had and why each was wrong.

## Infrastructure — still missing

- **No Clerk user has ever signed in**, so no one holds `publicMetadata.role`. `/admin` and `/portal` redirect to `/sign-in` and stop there. Roles are not self-service — an account must exist before a role can be set on it.
- **Razorpay** — see "Registration payment" above.

## Traps this codebase has already sprung

Each of these cost real debugging time. They are load-bearing, not style preferences.

- **Base CSS must stay inside `@layer base`.** An unlayered rule beats anything in `@layer utilities` regardless of specificity, so a bare `a { color: inherit }` silently overrode `text-white` on every link-shaped button. Invisible for a whole palette era.
- **`calc()` needs whitespace around its operator.** `h-[calc(100svh-4.5rem)]` is invalid CSS and collapses the element to auto height. Use an inline style or `calc(100svh_-_4.5rem)`.
- **Grid and flex children default to `min-width: auto`** and refuse to shrink below their content. A `min-w-[34rem]` table pushed the whole document into horizontal scroll until its column got `min-w-0`. Covered by tests at 320/390/768/1280.
- **Do not verify auth behaviour with `curl`.** Clerk's development instance completes a handshake in JavaScript, so curl sees a misleading 404. Use a real browser — Playwright is installed.
- **`npm run db:push` needs `-- --force` without a TTY** (CI, an agent). Safe on an empty database; check before running it against one holding real registrations.
- The dev-only `eval()` CSP error in the console is expected. React needs `eval` in development; production does not. **Do not weaken the CSP for it.**

## Verifying

```bash
npm run typecheck && npm run lint && npm test && npm run test:e2e
```

E2E runs against `next build && next start`, reusing a server on :3000 if one is up. The suite encodes two contracts worth keeping: the console must never render to a signed-out visitor, and the body must never scroll horizontally.

Since registration went behind an account, the suite **needs `CLERK_SECRET_KEY`** — `e2e/global-setup.ts` fetches a Clerk testing token and idempotently creates the passwordless `aspire.quest.e2e+clerk_test@example.com` account that `e2e/support/clerk.ts` signs in as. Two traps found wiring it up: ClerkJS is mounted per-route rather than in the root layout, so `clerk.signIn()` has to run on `/no-access` (the only unprotected route that loads Clerk without also mounting `<SignIn/>`); and visiting `/sign-in` leaves the dev-browser handshake in flight, so a second click in the same test gets its navigation cancelled — one link per test.

Screenshot before judging any visual change — Playwright drives real Chromium, and the masthead needs `--use-gl=swiftshader` in headless.

## Open threads

1. Sign in at `/admin` to create a Clerk account, then set `publicMetadata.role` to `admin`. Nothing in the console or portal is reachable until this happens.
2. The NMIMS crest is filtered (`grayscale invert`) to sit on the light header, because the supplied PNG has a black ground baked in. A transparent or light-ground asset removes the filter and restores the mark's true tonality.
3. Still blocked on the organiser: Ambiora '27 dates, full-resolution photos, the alumni CSV and the Placement Cell recruiter list, and whether this lives on an `nmims.edu` subdomain.
4. Create a Razorpay account, set the three env vars (test-mode keys first), and get organiser sign-off on the real fee and on whose account receives the money (personal vs. institutional — real accountability implications for an NMIMS-adjacent event). Then run a full test-mode payment through before this goes live for real students.
