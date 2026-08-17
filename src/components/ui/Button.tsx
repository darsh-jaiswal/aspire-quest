import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Three variants, deliberately few.
 *
 * `accent` is amber and is reserved for THE single primary call to action on a
 * page. If a second amber button appears on the same screen, one of them is
 * wrong — amber is semantic here, not decorative.
 */
type Variant =
  | "accent"
  | "primary"
  | "outline"
  | "gradient"
  | "gradient-soft"
  | "gradient-invert";

const VARIANTS: Record<Variant, string> = {
  accent:
    "bg-amber text-white border-amber hover:bg-amber-hover hover:border-amber-hover active:translate-y-px",
  primary:
    "bg-navy text-white border-navy hover:bg-navy-hover hover:border-navy-hover active:translate-y-px",
  outline:
    "bg-transparent text-navy border-hairline-strong hover:border-navy hover:bg-raised active:translate-y-px",
  /* Tonal gradients, not hue gradients — the palette is monochrome by
     design, so depth comes from a shift along the ink ramp rather than from
     introducing a colour the system does not have. */
  gradient:
    "border-transparent text-white bg-gradient-to-b from-navy-soft via-navy to-navy " +
    "hover:from-navy hover:via-navy-hover hover:to-navy-soft " +
    "shadow-sm hover:shadow active:translate-y-px",
  "gradient-soft":
    "border-hairline-strong text-navy bg-gradient-to-b from-surface via-raised to-sunken " +
    "hover:from-raised hover:via-sunken hover:to-sunken " +
    "active:translate-y-px",
  /* The paper-side gradient, for the emphatic action when it sits on ink —
     inverting keeps it the loudest thing in the bar instead of the quietest. */
  "gradient-invert":
    "border-transparent text-navy bg-gradient-to-b from-white via-surface to-sunken " +
    "hover:from-surface hover:via-sunken hover:to-sunken " +
    "shadow-sm hover:shadow active:translate-y-px",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded border px-5 py-3 " +
  "text-sm font-semibold tracking-tight transition-all duration-150 " +
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
