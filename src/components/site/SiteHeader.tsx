"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/content";
import { HeaderAccount } from "./HeaderAccount";

/**
 * Two entirely different headers behind one component, chosen by `dark`.
 *
 * `dark` is only ever passed by the three pages that opted into the noir
 * treatment (home, /register, /partners) — every other route gets the
 * original: a plain in-flow bar, painted from the (light, default) tokens,
 * scrolling away with the page like normal chrome. `overlay` (dark-only)
 * lets a page opt out of the fixed header's clearance spacer when its first
 * section already reserves that space itself — the homepage's Masthead is
 * bottom-anchored for exactly this.
 *
 * The dark branch is fixed, translucent, and detaches into a floating
 * rounded-rectangle bar past a small scroll threshold — matching React
 * Bits' navbar treatment rather than the site's usual monochrome-in-flow
 * chrome (see Button.tsx's `gradient-violet` for the same deliberate,
 * scoped departure). Its fill is `bg-ink`, a fixed pole rather than a
 * flippable token, since this branch only ever renders on pages already
 * wrapped in the dark scope.
 */
export function SiteHeader({
  overlay = false,
  dark = false,
}: {
  overlay?: boolean;
  dark?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!dark) return;
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dark]);

  if (!dark) {
    return (
      <header className="bg-surface">
        <Container className="flex h-[4.5rem] items-center justify-between gap-6">
          <Link
            href="/"
            className="group flex items-center gap-3"
            aria-label={`${SITE.name} — home`}
          >
            <span className="flex flex-col leading-none">
              <span className="text-[1.0625rem] font-semibold tracking-tight text-navy">
                Aspire&nbsp;Quest
              </span>
              <span className="mt-1 text-[0.6875rem] tracking-wide text-muted">
                {SITE.institution}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-sm font-semibold text-slate underline-offset-4 transition-colors hover:text-navy hover:underline sm:block"
            >
              Home
            </Link>
            <Link
              href="/jobs"
              className="mr-1 hidden text-sm font-semibold text-slate underline-offset-4 transition-colors hover:text-navy hover:underline sm:block"
            >
              Openings
            </Link>
            {/* "For recruiters" renders inside HeaderAccount: it must hide for
                accounts that already hold a console, so it is Clerk-aware. */}
            <HeaderAccount />
          </div>
        </Container>
      </header>
    );
  }

  return (
    <>
      <div
        className={`fixed inset-x-0 top-0 z-50 flex justify-center transition-[padding] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          scrolled ? "px-3 pt-3 sm:px-6" : "px-0 pt-0"
        }`}
      >
        <header
          className={`w-full border backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            scrolled
              ? "max-w-5xl rounded-2xl border-white/10 bg-ink/70 shadow-lg shadow-black/40"
              : "max-w-none rounded-none border-x-0 border-t-0 border-white/10 bg-ink/60"
          }`}
        >
          <Container
            className={`flex items-center justify-between gap-6 transition-[height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              scrolled ? "h-14" : "h-[4.5rem]"
            }`}
          >
            <Link
              href="/"
              className="group flex items-center gap-3"
              aria-label={`${SITE.name} — home`}
            >
              <span className="flex flex-col leading-none">
                <span className="text-[1.0625rem] font-semibold tracking-tight text-white">
                  Aspire&nbsp;Quest
                </span>
                <span className="mt-1 text-[0.6875rem] tracking-wide text-white/40">
                  {SITE.institution}
                </span>
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="hidden text-sm font-semibold text-white/70 transition-colors hover:text-white sm:block"
              >
                Home
              </Link>
              <Link
                href="/jobs"
                className="mr-1 hidden text-sm font-semibold text-white/70 transition-colors hover:text-white sm:block"
              >
                Openings
              </Link>
              {/* "For recruiters" renders inside HeaderAccount: it must hide
                  for accounts that already hold a console, so it is
                  Clerk-aware. */}
              <HeaderAccount dark />
            </div>
          </Container>
        </header>
      </div>
      {overlay ? null : <div aria-hidden="true" className="h-[4.5rem]" />}
    </>
  );
}
