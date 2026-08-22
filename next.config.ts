import type { NextConfig } from "next";

/**
 * Clerk's Frontend API host, decoded from the publishable key rather than
 * hardcoded — a publishable key is `pk_{test,live}_base64("<fapi-host>$")`.
 * Deriving it here means a future switch to a custom Clerk domain (or a
 * live-mode key) updates the CSP automatically instead of silently breaking
 * sign-in again the way the hardcoded-`'self'`-only policy did.
 */
function clerkFapiHost(): string | null {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const encoded = key?.match(/^pk_(test|live)_(.+)$/)?.[2];
  if (!encoded) return null;
  try {
    return Buffer.from(encoded, "base64").toString("utf8").replace(/\$$/, "");
  } catch {
    return null;
  }
}

/**
 * Security headers.
 *
 * NOTE ON CSP — a decision worth knowing about:
 * The plan calls for a nonce-based CSP. A per-request nonce requires
 * middleware to inject it into the HTML, which forces every page to render
 * dynamically. That directly conflicts with keeping the public marketing pages
 * static and CDN-served at zero compute, which is what keeps this inside the
 * free tier during a registration surge.
 *
 * The CSP below is the strict-as-possible *static-compatible* version:
 * everything is locked to 'self' with no external origins permitted, except
 * the specific third-party origins Clerk's hosted sign-in widget requires
 * (documented at https://clerk.com/docs/security/clerk-csp) — without these,
 * Clerk's JS fails to load and every sign-in page is permanently blank.
 * `script-src` must also allow 'unsafe-inline' because Next's hydration
 * bootstrap is an inline script and there is no nonce to whitelist it with.
 *
 * To upgrade to a true nonce CSP, add middleware that generates a nonce per
 * request and accept that pages become dynamic. See README § Security.
 */
function buildCsp(): string {
  const fapiHost = clerkFapiHost();
  const clerkScript = fapiHost ? ` https://${fapiHost}` : "";
  const clerkConnect = fapiHost ? ` https://${fapiHost}` : "";

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${clerkScript} https://challenges.cloudflare.com https://*.protect.clerk.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://img.clerk.com",
    "font-src 'self' data:",
    // Resume uploads are proxied through /api/resume/upload (browser → this
    // origin → Blob), so the only external connect-src needed is Clerk's.
    `connect-src 'self'${clerkConnect} https://*.protect.clerk.com`,
    "worker-src 'self' blob:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src https://challenges.cloudflare.com https://*.protect.clerk.com",
    "object-src 'none'",
    "base-uri 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

const CSP = buildCsp();

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
