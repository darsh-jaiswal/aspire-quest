/**
 * Where a granted role's console lives.
 *
 * Client-safe on purpose (no `server-only`): the public header reads the
 * session's `publicMetadata.role` after Clerk hydrates and swaps its student
 * CTA for the role's console link, and `/after-sign-in` uses the same mapping
 * server-side. One vocabulary, two callers.
 *
 * `role` is typed `unknown` because public metadata is free-form JSON edited
 * in a dashboard — anything unrecognised means "no console", never a link.
 */
export type ConsoleDestination = { href: string; label: string };

export function consoleDestination(role: unknown): ConsoleDestination | null {
  if (role === "admin") return { href: "/admin", label: "Admin console" };
  if (role === "recruiter") return { href: "/portal", label: "Recruiter portal" };
  return null;
}
