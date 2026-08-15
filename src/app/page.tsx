import { About } from "@/components/home/About";
import { Faq } from "@/components/home/Faq";
import { Hero } from "@/components/home/Hero";
import { Masthead } from "@/components/home/Masthead";
import { Pathways } from "@/components/home/Pathways";
import { Process } from "@/components/home/Process";
import { Proof } from "@/components/home/Proof";
import { TalentPool } from "@/components/home/TalentPool";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

/** Fully static — the public site is CDN-served and costs no compute. */
export const dynamic = "force-static";

export default function HomePage() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-navy focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main">
        <Masthead />
        <Hero />
        <About />
        <Proof />
        <TalentPool />
        <Process />
        <Pathways />
        <Faq />
      </main>

      <SiteFooter />
    </>
  );
}
