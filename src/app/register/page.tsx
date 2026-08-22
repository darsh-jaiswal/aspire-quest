import type { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Section";
import { requireStudent } from "@/lib/auth";
import { EDITION, REGISTRATION } from "@/lib/content";
import { RegistrationForm } from "./RegistrationForm";

export const metadata: Metadata = {
  title: "Student registration",
  description:
    "Register for Aspire Quest at MPSTME Shirpur. One form, a PDF resume, and a reference code on screen — no account needed.",
};

const CHECKLIST = [
  "Your current CGPA",
  "Your branch and year of study",
  "The focus area you want to be considered for",
  `A resume as a PDF, under ${REGISTRATION.resumeMaxLabel}`,
];

export default async function RegisterPage() {
  await requireStudent();
  const user = await currentUser();

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const suggestedName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <SiteHeader />

      <main id="main" className="pt-[4.5rem]">
        <Container className="grid gap-14 py-16 md:py-24 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <Eyebrow>Students</Eyebrow>
              <h1 className="mt-5 text-h1 font-semibold">Register.</h1>
              <p className="mt-5 text-lede text-slate">
                One form. When you submit it you get a reference code on screen
                — that code is your application.
              </p>

              <div className="mt-10">
                <h2 className="text-eyebrow font-semibold uppercase text-muted">
                  Have ready
                </h2>
                <ul className="mt-4 border-t border-hairline">
                  {CHECKLIST.map((item) => (
                    <li
                      key={item}
                      className="border-b border-hairline py-3 text-sm text-slate"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {!EDITION.registrationOpen ? (
                <p className="mt-8 rounded border border-hairline-strong bg-amber-wash px-4 py-3 text-sm text-slate">
                  <span className="font-semibold text-navy">
                    {EDITION.label} dates are not yet announced.
                  </span>{" "}
                  Applications submitted now are held and screened as soon as
                  partner onboarding closes.
                </p>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-8">
            <RegistrationForm email={email} suggestedName={suggestedName} />
          </div>
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}
