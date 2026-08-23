import { Container } from "@/components/ui/Container";
import { MouseQuadrantTracker } from "@/components/ui/MouseQuadrantTracker";
import { EDITION, SITE } from "@/lib/content";

/**
 * The masthead — the first screen.
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
      className="relative flex min-h-[24rem] flex-col justify-end overflow-hidden bg-ink text-paper [--color-focus:var(--color-paper)] sm:min-h-[28rem]"
    >
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

      <MouseQuadrantTracker
        text="Ambiora"
        hue={90}
        style={{ fontSize: "clamp(3rem, 15vw, 12.5rem)", lineHeight: 0.78 }}
        className="relative mt-6 flex select-none justify-center font-[family-name:var(--font-anton)] uppercase tracking-[-0.015em] text-paper sm:mt-9"
      />
    </section>
  );
}
