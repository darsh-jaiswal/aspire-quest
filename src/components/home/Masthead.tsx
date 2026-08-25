import ColorBends from "@/components/ColorBends";
import DotField from "@/components/DotField";
import { Container } from "@/components/ui/Container";
import { EDITION, SITE } from "@/lib/content";

/**
 * The masthead — the first screen. Deliberately holds no <h1>; the page's
 * one first-level heading belongs to the section below, which carries the
 * actual proposition ("The industry interviews here.").
 */
export function Masthead() {
  return (
    <section
      aria-label={`${SITE.parentEvent} — ${SITE.name}`}
      className="relative flex min-h-svh flex-col justify-end overflow-hidden bg-ink pb-8 text-paper [--color-focus:var(--color-paper)] sm:pb-12"
    >
      <div aria-hidden="true" className="absolute inset-0">
        <DotField
          dotRadius={1.5}
          dotSpacing={14}
          cursorRadius={500}
          cursorForce={0.1}
          bulgeOnly
          bulgeStrength={67}
          glowRadius={160}
          sparkle={false}
          waveAmplitude={0}
        />
        {/* Fades the glow band out toward the top ~25%, so it doesn't fight
            the header. Values are tuned for this wide banner — the pasted
            reference values (from React Bits' near-square preview panel)
            rendered as a near-invisible haze here; the shader stretches its
            pattern by the container's aspect ratio, and ours is far wider. */}
        <div
          className="absolute inset-0"
          style={{
            maskImage: "linear-gradient(to top, black 75%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to top, black 75%, transparent 100%)",
          }}
        >
          <ColorBends
            colors={["#A855F7"]}
            speed={0.2}
            frequency={1.0}
            noise={0.15}
            bandWidth={0.4}
            rotation={90}
            iterations={1}
            intensity={2.2}
            scale={2}
          />
        </div>
      </div>

      <Container className="relative">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 border-t border-paper/20 pt-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="flex items-center gap-2.5 text-eyebrow font-semibold uppercase">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-paper"
              />
              {EDITION.label}
              <span className="font-normal text-paper/45">
                · {EDITION.dateLabel}
              </span>
            </p>

            <p className="text-eyebrow uppercase text-paper/45">
              Scroll for the detail
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
