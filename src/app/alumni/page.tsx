import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Section";
import { PLACEMENTS } from "@/lib/content";
import { AlumniForm } from "./AlumniForm";

export const metadata: Metadata = {
  title: "Alumni referrals",
  description:
    "Open a door for MPSTME students. Refer your company to Aspire Quest — it takes about two minutes.",
};

export default function AlumniPage() {
  return (
    <>
      <SiteHeader />

      <main id="main" className="pt-[4.5rem]">
        <Container className="grid gap-14 py-16 md:py-24 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <Eyebrow>Alumni</Eyebrow>
              <h1 className="mt-5 text-h1 font-semibold">
                Open a door at your company.
              </h1>
              <p className="mt-5 text-lede text-slate">
                A named introduction from someone who studied here is the single
                most effective way a company enters the pipeline. Cold outreach
                is not.
              </p>

              <div className="mt-10 border-l-2 border-amber pl-5">
                <p className="text-slate">
                  Last edition,{" "}
                  <span data-figure className="font-semibold text-navy">
                    {PLACEMENTS.length}
                  </span>{" "}
                  third-year students left Aspire Quest with paid, PPO-eligible
                  internships. Each partner company in the room is one
                  conversation that someone started.
                </p>
              </div>

              <p className="mt-8 text-sm text-muted">
                You do not need to be a decision-maker. Pointing us at the right
                person is enough.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8">
            <AlumniForm />
          </div>
        </Container>
      </main>
    </>
  );
}
