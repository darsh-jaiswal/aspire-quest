import { ClerkProvider, SignOutButton, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NavTab } from "@/components/admin/NavTab";
import { ConsoleShell } from "@/components/admin/Shell";
import { requireAdmin } from "@/lib/auth";

/**
 * ClerkProvider is mounted HERE rather than in the root layout, deliberately.
 *
 * Wrapping the whole app would pull Clerk into the public marketing pages and
 * risk pushing them out of static rendering — those pages are the ones that
 * must stay CDN-served at zero compute during a registration surge.
 */

export const metadata: Metadata = {
  title: { default: "Console", template: "%s · Aspire Quest Console" },
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/bundles", label: "Bundles" },
  { href: "/admin/alumni", label: "Alumni" },
  { href: "/admin/audit", label: "Audit" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Re-checked here even though middleware already gated /admin(.*).
  await requireAdmin();

  return (
    <ClerkProvider>
      <ConsoleShell
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
