import Link from "next/link";
import type { ReactNode } from "react";

/**
 * `accent` is amber and is reserved for THE single primary call to action on a
 * page. If a second amber button appears on the same screen, one of them is
 * wrong — amber is semantic here, not decorative.
 */
type Variant =
  | "accent"
  | "primary"
  | "outline"
  | "outline-invert"
  | "gradient"
  | "gradient-soft"
  | "gradient-invert"
  | "gradient-violet";

const VARIANTS: Record<Variant, string> = {
  /* bg-navy/bg-amber are a dark fill in the default (light) era and a light
     fill inside the `.aq-noir` scope — `text-on-navy`/`text-on-amber` flip
     white/ink to match whichever fill is active, so these two variants
     render correctly on every page without knowing which era they're in. */
  accent:
    "bg-amber text-on-amber border-amber hover:bg-amber-hover hover:border-amber-hover active:translate-y-px",
  primary:
    "bg-navy text-on-navy border-navy hover:bg-navy-hover hover:border-navy-hover active:translate-y-px",
  outline:
    "bg-transparent text-navy border-hairline-strong hover:border-navy hover:bg-raised active:translate-y-px",
  /* outline's paper-side counterpart, for a secondary action that sits on
     ink or on the glass header rather than on paper. Hardcoded white/black —
     only ever used inside the always-dark header, so it doesn't need to
     track the era. */
  "outline-invert":
    "bg-transparent text-white border-white/20 hover:border-white/35 hover:bg-white/10 active:translate-y-px",
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
  /* The one deliberate departure from the monochrome system: a borrowed
     violet-to-pink identity for the glass header on its three dark-scoped
     pages, requested to match React Bits' navbar exactly rather than
     reskinned into the ink ramp. Hardcoded — only ever rendered by the
     header's dark branch, so (like outline-invert) it doesn't need to track
     the era either. Scoped to this variant only — every other button stays
     hue-free. */
  "gradient-violet":
    "border-transparent text-white bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] " +
    "hover:from-[#9c6bff] hover:to-[#ff5fae] " +
    "shadow-[0_0_20px_-4px_rgba(139,92,246,0.6)] hover:shadow-[0_0_24px_-2px_rgba(217,70,239,0.65)] " +
    "active:translate-y-px",
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
