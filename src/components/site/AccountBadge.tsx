"use client";

import Link from "next/link";
import { SignOutButton, useUser } from "@clerk/nextjs";

/**
 * The signed-in indicator for the public site.
 *
 * Auth state resolves CLIENT-side after hydration, which is the whole trick:
 * the page itself stays static and CDN-served, and this badge fills in a
 * moment later — "Sign in" for visitors, the account email + sign out for
 * everyone else. Same pattern every large site uses on its cacheable pages.
 */
export function AccountBadge() {
  const { isLoaded, isSignedIn, user } = useUser();

  // Reserve the space while Clerk loads so the header doesn't jump.
  if (!isLoaded) return <span className="hidden h-5 w-16 sm:block" />;

  if (!isSignedIn) {
    return (
      <Link
        href="/sign-in"
        className="hidden text-sm font-semibold text-slate underline-offset-4 transition-colors hover:text-navy hover:underline sm:block"
      >
        Sign in
      </Link>
    );
  }

  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const initials =
    (user.firstName?.[0] ?? email[0] ?? "?").toUpperCase() +
    (user.lastName?.[0] ?? "").toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex size-7 items-center justify-center rounded-full bg-navy text-[0.6875rem] font-semibold text-white"
      >
        {initials}
      </span>
      <span
        className="hidden max-w-[16ch] truncate text-sm text-muted md:block"
        title={email}
      >
        {email}
      </span>
      <SignOutButton>
        <button className="text-sm font-semibold text-slate underline-offset-4 transition-colors hover:text-navy hover:underline">
          Sign out
        </button>
      </SignOutButton>
    </div>
  );
}
