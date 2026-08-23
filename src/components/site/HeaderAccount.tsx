import { ClerkProvider } from "@clerk/nextjs";
import { AccountBadge } from "./AccountBadge";

/**
 * Mounts the account badge under its own ClerkProvider, scoped to the header
 * widget rather than the whole tree — the root layout stays provider-free so
 * the marketing pages keep their static rendering, and clerk-js is a
 * singleton, so this coexists with the providers that /register, /admin and
 * /portal mount for themselves.
 *
 * On a deployment with no Clerk keys the badge simply doesn't render —
 * the public site's survive-without-environment guarantee holds.
 */
const CLERK_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function HeaderAccount() {
  if (!CLERK_CONFIGURED) return null;

  return (
    <ClerkProvider>
      <AccountBadge />
    </ClerkProvider>
  );
}
