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
| Razorpay | **Live** keys, `NEXT_PUBLIC_RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`/`RAZORPAY_WEBHOOK_SECRET` set on Production via `vercel env add` (2026-08-23). Account is Darsh Jaiswal's personal/individual account (Unregistered business type on Razorpay, KYC approved same day) — **not an NMIMS-authorized account**; see "Registration payment" below |

## Registration email

- **Confirmation email** sends on every successful registration (`src/app/register/actions.ts`), fire-and-safe via `waitUntil` so it survives after the response is returned. A send failure never fails the registration — the DB row is the real record, the email is a courtesy. See `src/lib/email.ts`.
- **Reminder emails** (`src/lib/reminders.ts`, cron at `src/app/api/cron/reminders/route.ts`, scheduled daily in `vercel.json`) send at 7/3/1 days before `EDITION.startsAt` (`src/lib/content.ts`). **This is a deliberate no-op while `EDITION.startsAt` is `null`** — Ambiora '27 dates aren't announced yet. Once an organiser sets a real date and redeploys, the cron picks up automatically; no other step needed. Protected by `CRON_SECRET` (set on all environments).
- Both use React Email templates in `src/emails/`. Idempotency keys prevent duplicate sends on retry.
- Resend free tier caps at 100 emails/day — accepted as a known risk for now per the organiser (a registration surge could hit this on confirmations alone). Revisit if it becomes a real problem.

## Registration payment (Stage 2, built 2026-08-23, verified live same day)

- **Live and verified end-to-end.** Full pipeline confirmed with a real ₹100 payment on 2026-08-23: order created → Razorpay Checkout opened → payment captured → webhook received with `signature_valid=true` → exactly one `order.paid` event → compare-and-swap moved the row to `paid` → reference code issued → confirmation email sent. Checked against the actual `students`/`payment_orders`/`payment_events` rows, not just the UI. The CSP allowances (`checkout.razorpay.com`, `api.razorpay.com`, `lumberjack.razorpay.com`) are confirmed sufficient — the popup was never blocked.
- The fee (`REGISTRATION_FEE.amountPaise` in `src/lib/content.ts`) is a real, live ₹100 — a provisional figure the site owner set directly, **still not organiser-confirmed as final**. Set `amountPaise` back to `null` to make registration free again with no other code change.
- **Open risk, not a code issue:** the Razorpay account receiving this money is Darsh Jaiswal's **personal** account (Individual/Unregistered business type) — not an NMIMS-authorized one. NMIMS has not been formally contacted; only a professor is informally aware of this project. The site's payment/legal pages (`/contact`, `/terms`, `/privacy`, `/refunds`) intentionally show Darsh's personal phone/email (`PAYMENT_CONTACT` in `content.ts`), not the campus ones, to stay consistent with who actually holds the account. This was a deliberate choice, not an oversight — but it means real students' money is currently going to a personal, not institutional, account. Get explicit organiser sign-off before treating this as the permanent arrangement.
- **Two new crons**, both protected by `CRON_SECRET` like the existing two: `payment-reconciliation` (daily, asks Razorpay directly about any order stuck non-terminal over an hour — the fallback for a webhook that never arrives) and `sweep-pending-registrations` (daily, deletes abandoned `pending_payment` rows older than 24h that never got as far as a payment attempt — a row with ANY payment order is kept permanently, on purpose, see `payment-flow-review.md` Defect 5).
- The webhook at `/api/payments/razorpay/webhook` is the only writer of `payment_status='paid'` — a single compare-and-swap `UPDATE ... WHERE payment_status='pending_payment'`, shared with the reconciliation cron via `src/lib/payment-settlement.ts`. Read `payment-flow-review.md` before touching this path; it records six real defects an earlier draft of this design had and why each was wrong.
- Settlement to Darsh's bank account follows Razorpay's normal payout cycle (commonly T+2 to T+7 business days, longer on the first payout) — a captured payment sits in the Razorpay balance, not the bank, until that cycle runs. Check Dashboard → Settlements for actual payout status; not something this codebase can observe.

## Infrastructure — still missing

- **No Clerk user has ever signed in**, so no one holds `publicMetadata.role`. `/admin` and `/portal` redirect to `/sign-in` and stop there. Roles are not self-service — an account must exist before a role can be set on it.

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

Since registration went behind an account, the suite **needs `CLERK_SECRET_KEY`** — `e2e/global-setup.ts` fetches a Clerk testing token and idempotently creates two passwordless accounts that `e2e/support/clerk.ts` signs in as: `aspire.quest.e2e+clerk_test@example.com` (must stay row-less — several specs assert a blank form) and `aspire.quest.e2e.prefill+clerk_test@example.com`, used only by `registration-prefill.spec.ts`, which seeds/deletes a real `pending_payment` row for it in the live database to prove saved drafts rehydrate. Two traps found wiring it up: ClerkJS is mounted per-route rather than in the root layout, so `clerk.signIn()` has to run on `/no-access` (the only unprotected route that loads Clerk without also mounting `<SignIn/>`); and visiting `/sign-in` leaves the dev-browser handshake in flight, so a second click in the same test gets its navigation cancelled — one link per test.

Screenshot before judging any visual change — Playwright drives real Chromium, and the masthead needs `--use-gl=swiftshader` in headless.

## Open threads

1. Sign in at `/admin` to create a Clerk account, then set `publicMetadata.role` to `admin`. Nothing in the console or portal is reachable until this happens.
2. The NMIMS crest is filtered (`grayscale invert`) to sit on the light header, because the supplied PNG has a black ground baked in. A transparent or light-ground asset removes the filter and restores the mark's true tonality.
3. Still blocked on the organiser: Ambiora '27 dates, full-resolution photos, the alumni CSV and the Placement Cell recruiter list, and whether this lives on an `nmims.edu` subdomain.
4. Get organiser sign-off on the real registration fee (currently a provisional ₹100) and on whether it's acceptable for a **personal** Razorpay account to keep receiving student payments long-term, or whether this needs to move to an NMIMS-authorized account before broader rollout. Razorpay itself is live and verified (2026-08-23) — this is a policy/accountability question now, not a technical one.
