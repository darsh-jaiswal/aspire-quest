import { Container } from "@/components/ui/Container";
import { MagnetLines } from "@/components/ui/magnet-lines";
import { PixelCanvas } from "@/components/ui/pixel-canvas";
import { TextRepel } from "@/components/ui/text-repel";
import { EDITION, SITE } from "@/lib/content";

/**
 * The masthead — the first screen, and the only place on the site that spends
 * any ink on spectacle.
 *
 * Three layers, in depth order:
 *   0. The pixel field, shimmering at the very back.
 *   1. The line field, spanning the screen and held at a whisper. Every line
 *      points at the pointer, which makes the whole plane feel attentive
 *      without asking to be looked at.
 *   2. The wordmark, set large along the bottom edge and deliberately cropped,
 *      so the screen reads as a fragment of something bigger than the viewport.
 *
 * Deliberately NOT an <h1>. The page's one first-level heading belongs to the
 * section below, which carries the actual proposition ("The industry
 * interviews here."). A decorative wordmark outranking it would be a
 * regression in document structure, not a design flourish.
 */
export function Masthead() {
  return (
    <section
      aria-label={`${SITE.parentEvent} — ${SITE.name}`}
      style={{ height: "100svh" }}
      className="relative isolate flex min-h-[34rem] flex-col justify-end overflow-hidden bg-ink text-paper [--color-focus:var(--color-paper)]"
    >
      {/* 0 — the pixel field, furthest back. Lights up around the cursor. */}
      <div className="pointer-events-none absolute inset-0 -z-30 opacity-80">
        <PixelCanvas
          variant="glow"
          colors={["#22c55e", "#10b981", "#14b8a6", "#06b6d4"]}
          gap={10}
          speed={0.01}
        />
      </div>

      {/* 1 — texture, spanning the full screen */}
      <div className="pointer-events-none absolute inset-0 -z-20 opacity-40">
        <MagnetLines
          rows={12}
          columns={20}
          containerSize="100%"
          lineColor="currentColor"
          lineWidth="0.5vmin"
          lineHeight="3.5vmin"
          baseAngle={0}
        />
      </div>

      {/* Ink rising from the floor, so the type below never has to compete
          with the field for legibility. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-[5] h-2/3 bg-gradient-to-t from-ink via-ink/90 to-transparent"
      />

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

      {/* 3 — the wordmark, cropped by the floor of the section. Repels from
          the cursor rather than sitting inert — the one place on the page
          that invites a poke. */}
      <div
        style={{ fontSize: "clamp(3rem, 15vw, 12.5rem)", lineHeight: 0.78 }}
        className="relative mt-6 flex select-none justify-center font-[family-name:var(--font-anton)] uppercase tracking-[-0.015em] text-paper sm:mt-9"
      >
        {/* Peak displacement is ~strength/stiffness, so these are chosen as a
            pair: ~55px of throw. Damping sits well under critical
            (2*sqrt(k*m) ≈ 12) to keep the overshoot bouncy rather than
            letting the glyph slide back and stop dead. */}
        <TextRepel
          text="Ambiora"
          className="pointer-events-auto"
          stiffness={90}
          damping={4.5}
          mass={0.4}
          strength={5000}
        />
      </div>
    </section>
  );
}
