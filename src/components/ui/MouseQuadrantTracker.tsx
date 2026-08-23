"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

/**
 * Text-shadow "extrusion" that leans away from the cursor, quadrant by
 * quadrant. Adapted from a full-viewport demo component: here the listener
 * is on `window` rather than the element itself, because the wordmark this
 * wraps is a fraction of the screen, not the whole page — element-only
 * tracking would mean the effect only ever fires while hovering the letters.
 */
type MouseQuadrantTrackerProps = {
  text: string;
  hue?: number;
  shadowIntensity?: number;
  className?: string;
  style?: CSSProperties;
};

export function MouseQuadrantTracker({
  text,
  hue = 90,
  shadowIntensity = 6,
  className = "",
  style,
}: MouseQuadrantTrackerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const { x, y, width, height } = el.getBoundingClientRect();
      const quadX = event.clientX - (x + width / 2);
      const quadY = event.clientY - (y + height / 2);
      el.style.setProperty("--x-quadrant", quadX >= 0 ? "1" : "-1");
      el.style.setProperty("--y-quadrant", quadY >= 0 ? "1" : "-1");
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const shadowLayers = [1, 2, 3, 4, 5]
    .map((step) => {
      const offset = shadowIntensity * step;
      const lightness = 70 - step * 10;
      return `calc(var(--x-quadrant) * ${offset}px) calc(var(--y-quadrant) * ${offset}px) 0 hsl(var(--hue) 80% ${lightness}%)`;
    })
    .join(", ");

  return (
    <div
      ref={ref}
      className={className}
      style={
        {
          "--hue": hue,
          "--x-quadrant": "1",
          "--y-quadrant": "1",
          textShadow: shadowLayers,
          transition: "text-shadow 0.15s ease",
          ...style,
        } as CSSProperties
      }
    >
      {text}
    </div>
  );
}
