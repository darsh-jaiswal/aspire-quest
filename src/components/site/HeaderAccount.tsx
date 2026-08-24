import { ClerkProvider } from "@clerk/nextjs";
import { ButtonLink } from "@/components/ui/Button";
import { AccountBadge } from "./AccountBadge";
import { HeaderCta } from "./HeaderCta";

/**
 * The header's account-aware corner: the primary CTA (Register / My
 * application) and the signed-in badge, under one ClerkProvider scoped to
 * this widget rather than the whole tree — the root layout stays
 * provider-free so the marketing pages keep their static rendering, and
 * clerk-js is a singleton, so this coexists with the providers that
 * /register, /dashboard, /admin and /portal mount for themselves.
 *
 * On a deployment with no Clerk keys the CTA falls back to a static
 * Register link and the badge doesn't render — the public site's
 * survive-without-environment guarantee holds.
 */
const CLERK_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function HeaderAccount() {
  if (!CLERK_CONFIGURED) {
    return (
      <ButtonLink href="/register" variant="gradient" className="px-4 py-2.5">
        Register
      </ButtonLink>
    );
  }

  return (
    <ClerkProvider>
      <HeaderCta />
      <AccountBadge />
    </ClerkProvider>
  );
}
