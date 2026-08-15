import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DESCRIPTION, SITE, TAGLINE } from "@/lib/content";
import "./globals.css";

/* Two text weights — hierarchy comes from scale and tracking, not a weight
   ladder. See globals.css § Type.
   800 is the one exception, loaded solely for the masthead wordmark, where the
   letterforms are the artwork rather than a heading. It is not available to
   body copy by convention. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${TAGLINE}`,
    template: `%s · ${SITE.name}`,
  },
  description: DESCRIPTION,
  applicationName: SITE.name,
  openGraph: {
    title: `${SITE.name} — ${TAGLINE}`,
    description: DESCRIPTION,
    url: SITE.url,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${TAGLINE}`,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-surface text-slate">
        {children}
      </body>
    </html>
  );
}
