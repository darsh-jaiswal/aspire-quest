# Campus Recruiting Platform

I built a full recruiting platform for a college's campus placement event: partner companies post real openings, students register with a resume and get screened by CGPA/branch/focus area, and recruiters review exactly the applicants who applied to their roles, ranked by an AI-scored fit against each opening. This case study documents the real Aspire Quest build for Ambiora at MPSTME, NMIMS Shirpur. The underlying pattern (partner intake, student registration, resume-based screening, recruiter review) can also be adapted for other campus recruiting events.

## Who can use this

- **University career fairs and placement cells** running any campus recruiting drive.
- **Corporate campus-hiring programs** that need a structured intake and screening pipeline instead of an email inbox full of resumes.
- **Hackathon-to-hiring pipelines**, where sponsor companies want to review participants against real openings, not just demo submissions.
- **Professional bootcamps and certification programs** running a placement drive at the end of a cohort.
- **Alumni-network job placement programs**, where an alumni association wants to run the same kind of structured matching between graduates and hiring partners.

## What I built

Full-stack, end to end: a public marketing site, a gated student registration and payment flow, a recruiter portal, and an admin console, all on one Next.js codebase.

- **Student side**: registration gated behind a verified Google/Microsoft sign-in (not a password), resume upload to private storage, a dashboard to track application status and manage up to 3 resume versions, and self-service withdrawal.
- **Recruiter side**: a portal where a company posts an opening and reviews only the students who applied to it, ranked by an AI-generated fit score they can re-run.
- **Admin side**: a screening console for reviewing every registration against CGPA/branch/focus-area filters, a company/partner pipeline board, bulk status-change emails, and an audit log of every resume access.

## Architecture

- **Framework**: Next.js 16 App Router, React 19, TypeScript, Tailwind v4.
- **Database**: Neon Postgres + Drizzle ORM, pooled connection string (serverless-safe under registration-day load).
- **Auth**: Clerk, scoped to admin and recruiter accounts only. Students never get an account; their identity is verified once at registration via Google/Microsoft sign-in, not a password.
- **Resume storage**: Vercel Blob, private store, direct client uploads. Every read is access-logged; a resume is visible only to the admin team and the specific companies a student applied to.
- **AI-powered applicant scoring**: the recruiter portal's "Re-run scoring" ranks applicants against an opening's requirements using the **Anthropic API** (`src/lib/scoring.ts`). Real, working use of Claude in production, not a demo.
- **Payments**: Razorpay, integrated directly via their SDK (not a marketplace plugin), with webhook signature verification, a daily reconciliation cron that asks Razorpay directly about any payment stuck non-terminal, and a sweep cron for abandoned registrations.
- **Rate limiting**: Upstash Redis, fails **closed** on purpose. Public forms reject rather than silently accept when the rate limiter is unreachable.
- **Email**: Resend, with React Email templates for confirmations, reminders, and status-change notifications, all idempotency-keyed to prevent duplicate sends on retry.
- **Testing**: Vitest for unit tests (validation, scoring, access policy, CSV export, withdrawal logic all have dedicated test files), Playwright for e2e (registration, payment, auth-gating, and a console-must-never-render-to-a-signed-out-visitor contract).

## If you're short on time, look at these

- [`src/lib/scoring.ts`](./src/lib/scoring.ts), the Anthropic API integration that ranks applicants against an opening.
- [`payment-flow-review.md`](./payment-flow-review.md), a real design review that documents six actual defects an earlier draft of the payment flow had, and why each one was wrong, before any of it shipped.
- [`src/lib/access-policy.ts`](./src/lib/access-policy.ts) and its test file, the actual authorization rule for who can view a student's resume.
- [`docs/superpowers/specs/`](./docs/superpowers/specs) and [`docs/superpowers/plans/`](./docs/superpowers/plans), the actual written spec and implementation plan that drove this feature, before any code was written.

## Built with Claude Code

This was built with a spec-first Claude Code workflow: a written spec and plan (see the two docs linked above) preceded implementation, not the other way around. That discipline shows up elsewhere too: [`src/lib/content.ts`](./src/lib/content.ts) enforces a rule that every public-facing fact must be sourced, and an unknown is modelled as `null`/`"TBA"`, never a plausible-looking invented number. This mirrors the practice in my other projects; see [`personal-claude-skill`](https://github.com/darsh-jaiswal/personal-claude-skill) for a Claude Code Skill I authored along the same lines.

## What I changed my mind about

`payment-flow-review.md` is the artifact I'm most glad exists: a self-review that found six real defects in an earlier version of the payment design (races, an unsafe retry path, a reconciliation gap) and fixed each one before real money touched the system, not after. The instinct to write that review instead of shipping the first version that compiled is exactly the kind of thing you don't learn until you've been burned by not doing it once.

## Repository and configuration

This is the original Aspire Quest application for Ambiora at MPSTME, NMIMS Shirpur. Real institutional details and the official NMIMS logo are retained with the owner's stated permission. This README was transferred from the Campus Recruiting Platform case study. The original project documentation is preserved in `PROJECT-README.md`.

Production environment files, provider credentials, uploaded resumes, and database exports are excluded. `.env.example` lists configuration names and placeholders only. Supply your own server-side credentials to run an independent instance; do not commit private environment values.
