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
| Neon Postgres | `neon-erin-mountain`, schema pushed, all 9 tables live |
| Clerk | `clerk-cyan-fence`, keys set on all environments |

## Infrastructure — still missing

Each fails in its own deliberate way. Do not "fix" these failures; they are the intended direction.

- **Vercel Blob** (`BLOB_READ_WRITE_TOKEN`) → resume upload fails, so registration cannot complete
- **Upstash Redis** (`UPSTASH_REDIS_REST_*`) → public forms reject; `src/lib/rate-limit.ts` fails **closed** on purpose
- **No Clerk user has ever signed in**, so no one holds `publicMetadata.role`. `/admin` and `/portal` redirect to `/sign-in` and stop there. Roles are not self-service — an account must exist before a role can be set on it.

Both remaining integrations need a marketplace terms click in a browser (`vercel integration add <name>`); the CLI cannot complete that step alone.

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

Screenshot before judging any visual change — Playwright drives real Chromium, and the masthead needs `--use-gl=swiftshader` in headless.

## Open threads

1. Sign in at `/admin` to create a Clerk account, then set `publicMetadata.role` to `admin`. Nothing in the console or portal is reachable until this happens.
2. Provision Blob and Upstash so the three intake forms can actually complete.
3. The NMIMS crest is filtered (`grayscale invert`) to sit on the light header, because the supplied PNG has a black ground baked in. A transparent or light-ground asset removes the filter and restores the mark's true tonality.
4. Still blocked on the organiser: Ambiora '27 dates, full-resolution photos, the alumni CSV and the Placement Cell recruiter list, and whether this lives on an `nmims.edu` subdomain.
