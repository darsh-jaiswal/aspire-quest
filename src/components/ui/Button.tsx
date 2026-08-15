import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Three variants, deliberately few.
 *
 * `accent` is amber and is reserved for THE single primary call to action on a
 * page. If a second amber button appears on the same screen, one of them is
 * wrong — amber is semantic here, not decorative.
 */
type Variant = "accent" | "primary" | "outline";

const VARIANTS: Record<Variant, string> = {
  accent:
    "bg-amber text-white border-amber hover:bg-amber-hover hover:border-amber-hover active:translate-y-px",
  primary:
    "bg-navy text-white border-navy hover:bg-navy-hover hover:border-navy-hover active:translate-y-px",
  outline:
    "bg-transparent text-navy border-hairline-strong hover:border-navy hover:bg-raised active:translate-y-px",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded border px-5 py-3 " +
  "text-sm font-semibold tracking-tight transition-colors duration-150 " +
  "motion-reduce:transition-none";

export function ButtonLink({
  href,
  variant = "primary",
  children,
  className = "",
}: {
  href: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`${BASE} ${VARIANTS[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      {...props}
      className={`${BASE} ${VARIANTS[variant]} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
