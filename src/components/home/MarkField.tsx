"use client";

import { useEffect, useRef } from "react";
import { AmbioraMark } from "./AmbioraMark";

/**
 * A field of Ambiora marks whose triangles all turn to face the pointer.
 *
 * Performance notes, because this runs on every pointer move:
 *
 *  - Pointer events only record coordinates. All the maths and all the DOM
 *    writes happen once per frame in a rAF callback, so a fast mouse cannot
 *    queue up more work than the display can show.
 *  - The only thing written is a custom property driving a `rotate()`. That
 *    stays on the compositor — no layout, no paint.
 *  - Cell centres are measured once and re-measured on resize, never per
 *    frame. `getBoundingClientRect` in a move handler is the usual way this
 *    kind of effect starts dropping frames.
 *
 * Reduced motion is honoured by not attaching the listener at all: the marks
 * render in their resting position and simply never move.
 */

const CELL_COUNT = 96;

export function MarkField({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cellsRef = useRef<HTMLSpanElement[]>([]);
  const centresRef = useRef<{ x: number; y: number }[]>([]);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    const measure = () => {
      centresRef.current = cellsRef.current.map((cell) => {
        const rect = cell.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      });
    };

    measure();

    const render = () => {
      frameRef.current = null;
      const pointer = pointerRef.current;
      if (!pointer) return;

      const centres = centresRef.current;
      for (let i = 0; i < cellsRef.current.length; i += 1) {
        const centre = centres[i];
        if (!centre) continue;

        // The mark's triangle points "up" at rest, hence the +90° offset.
        const angle =
          (Math.atan2(pointer.y - centre.y, pointer.x - centre.x) * 180) /
            Math.PI +
          90;

        cellsRef.current[i]?.style.setProperty("--mark-angle", `${angle}deg`);
      }
    };

    const schedule = () => {
      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(render);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      schedule();
    };

    // Scrolling moves the cells under a stationary pointer, so the cached
    // centres have to be refreshed for the field to keep tracking correctly.
    const onScrollOrResize = () => {
      measure();
      schedule();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`grid select-none gap-0 overflow-hidden [grid-template-columns:repeat(auto-fill,minmax(9rem,1fr))] ${className}`}
    >
      {Array.from({ length: CELL_COUNT }, (_, index) => (
        <span
          key={index}
          ref={(node) => {
            if (node) cellsRef.current[index] = node;
          }}
          className="flex aspect-square items-center justify-center"
        >
          <AmbioraMark className="size-[58%]" />
        </span>
      ))}
    </div>
  );
}
