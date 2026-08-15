import { ClerkProvider, SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

/**
 * Console sign-in.
 *
 * Admins and recruiters only — students have no accounts, which is why there
 * is no sign-up route anywhere in this application. Recruiters are invited by
 * an admin; there is deliberately no self-registration path into the console.
 */
export default function SignInPage() {
  return (
    <ClerkProvider>
      <main className="flex min-h-screen flex-col items-center justify-center bg-raised px-6 py-16">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="text-[1.0625rem] font-semibold tracking-tight text-navy"
          >
            Aspire&nbsp;Quest
          </Link>
          <p className="mt-2 text-sm text-muted">
            Console access for organisers and partner recruiters.
          </p>
        </div>

        <SignIn />

        <p className="mt-10 max-w-[44ch] text-center text-sm text-muted">
          Students do not need an account. If you registered as a candidate,
          your reference code is your application —{" "}
          <Link
            href="/register"
            className="font-semibold text-navy underline-offset-4 hover:underline"
          >
            go to registration
          </Link>
          .
        </p>
      </main>
    </ClerkProvider>
  );
}
