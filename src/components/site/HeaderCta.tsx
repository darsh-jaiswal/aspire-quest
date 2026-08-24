"use client";

import { useUser } from "@clerk/nextjs";
import { ButtonLink } from "@/components/ui/Button";

/**
 * The header's primary call to action, resolved client-side like the
 * account badge: the page stays static and CDN-served, and after Clerk
 * hydrates, a signed-in visitor's "For students" becomes "My application"
 * — a registered student should never be told to register.
 *
 * "For students" mirrors "For recruiters" beside it — the signed-out
 * header addresses its two audiences in parallel. It is also the loading
 * state, so signed-out visitors (the majority on marketing pages) see no
 * flicker at all.
 */
export function HeaderCta() {
  const { isLoaded, isSignedIn } = useUser();
  const signedIn = isLoaded && isSignedIn;

  return (
    <ButtonLink
      href={signedIn ? "/dashboard" : "/register"}
      variant="gradient"
      className="px-4 py-2.5"
    >
      {signedIn ? "My application" : "For students"}
    </ButtonLink>
  );
}
