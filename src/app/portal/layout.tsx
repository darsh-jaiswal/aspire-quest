import { ClerkProvider, SignOutButton, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NavTab } from "@/components/admin/NavTab";
import { ConsoleShell } from "@/components/admin/Shell";
import { requireRecruiter } from "@/lib/auth";

/**
 * The recruiter portal.
 *
 * Mounted separately from /admin and gated by `requireRecruiter`, which rejects
 * admins as well as anonymous traffic. Keeping the two roles on two route
 * trees means a recruiter never loads a page whose data functions were written
 * assuming an admin caller.
 *
 * As in the admin console, ClerkProvider is mounted here rather than at the
 * root so the public marketing pages stay static and CDN-served.
 */

export const metadata: Metadata = {
  title: { default: "Portal", template: "%s · Aspire Quest Portal" },
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { href: "/portal/openings", label: "Job openings" },
  { href: "/portal", label: "Candidate sets", exact: true },
];

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Re-checked here even though the proxy already gated /portal(.*).
  await requireRecruiter();

  return (
    <ClerkProvider>
      <ConsoleShell
        label="Portal"
        nav={SECTIONS.map((section) => (
          <NavTab key={section.href} {...section} />
        ))}
        user={
          <div className="flex items-center gap-4">
            <SignOutButton>
              <button className="text-sm text-muted transition-colors hover:text-navy">
                Sign out
              </button>
            </SignOutButton>
            <UserButton />
          </div>
        }
      >
        {children}
      </ConsoleShell>
    </ClerkProvider>
  );
}
