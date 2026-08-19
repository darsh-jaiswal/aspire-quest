import type { NextConfig } from "next";

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
 * everything is locked to 'self' with no external origins permitted, but
 * `script-src` must allow 'unsafe-inline' because Next's hydration bootstrap
 * is an inline script and there is no nonce to whitelist it with.
 *
 * To upgrade to a true nonce CSP, add middleware that generates a nonce per
 * request and accept that pages become dynamic. See README § Security.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // Resume uploads are proxied through /api/resume/upload (browser → this
  // origin → Blob), not direct-to-Blob, so no external connect-src is needed.
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "upgrade-insecure-requests",
].join("; ");

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
