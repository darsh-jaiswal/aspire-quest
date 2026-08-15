import { Container } from "@/components/ui/Container";
import { EDITION, SITE } from "@/lib/content";
import { AmbioraStage } from "./AmbioraStage";
import { MarkField } from "./MarkField";

/**
 * The masthead — the first screen, and the only place on the site that spends
 * any ink on spectacle.
 *
 * Three layers, in depth order:
 *   1. The mark field, held at a whisper. It is texture, not subject: the
 *      triangles track the pointer, which makes the whole plane feel attentive
 *      without asking to be looked at.
 *   2. The mark itself, in three dimensions, drifting until someone grabs it.
 *   3. The wordmark, set large along the bottom edge and deliberately cropped,
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
      style={{ height: "calc(100svh - 4.5rem)" }}
      className="relative isolate flex min-h-[34rem] flex-col justify-end overflow-hidden bg-ink text-paper [--color-focus:var(--color-paper)]"
    >
      {/* 1 — texture */}
      <div className="pointer-events-none absolute inset-0 -z-20 text-paper/10">
        <MarkField className="h-full w-full" />
      </div>

      {/* 2 — subject. Sits above the field, below the type. */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[68%] cursor-grab active:cursor-grabbing">
        <AmbioraStage />
      </div>

      {/* Ink rising from the floor, so the type below never has to compete
          with either layer for legibility. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-[5] h-2/3 bg-gradient-to-t from-ink via-ink/90 to-transparent"
      />

      <Container className="relative">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 border-t border-paper/20 pt-5">
          <p className="max-w-[42ch] text-sm leading-relaxed text-paper/70">
            The careers track of {SITE.parentEvent} — where partner companies
            interview {SITE.institution} students and make real offers.
          </p>

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

            {/* The drag hint is hidden on small screens because that is
                exactly where AmbioraStage declines to load the draggable
                object — telling a phone user to drag something that isn't
                there would be an instruction to nowhere. */}
            <p className="text-eyebrow uppercase text-paper/45">
              <span className="hidden sm:inline">Drag the mark · </span>
              Scroll for the detail
            </p>
          </div>
        </div>
      </Container>

      {/* 3 — the wordmark, cropped by the floor of the section. */}
      <p
        aria-hidden="true"
        style={{ fontSize: "clamp(3rem, 15vw, 12.5rem)", lineHeight: 0.78 }}
        className="pointer-events-none relative mt-6 select-none whitespace-nowrap text-center font-extrabold uppercase tracking-[-0.055em] text-paper sm:mt-9"
      >
        Ambiora
      </p>
    </section>
  );
}
