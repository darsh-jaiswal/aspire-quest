"use client";

import { useEffect, useRef } from "react";

interface MagnetLinesProps {
  rows?: number;
  columns?: number;
  containerSize?: string;
  lineColor?: string;
  lineWidth?: string;
  lineHeight?: string;
  baseAngle?: number;
  className?: string;
}

/**
 * A grid of lines that all rotate to point at the cursor.
 *
 * All maths happens once per animation frame in response to pointer
 * coordinates, and only a CSS custom property (--magnet-angle) is written,
 * so rotation stays on the compositor. Cell centres are measured once and
 * re-measured on scroll/resize, never per pointer move.
 */
export function MagnetLines({
  rows = 9,
  columns = 9,
  containerSize = "60vmin",
  lineColor = "currentColor",
  lineWidth = "0.8vmin",
  lineHeight = "5vmin",
  baseAngle = 0,
  className = "",
}: MagnetLinesProps) {
  const cellsRef = useRef<HTMLSpanElement[]>([]);
  const centresRef = useRef<{ x: number; y: number }[]>([]);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const frameRef = useRef<number | null>(null);

  const total = rows * columns;

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

        const angle =
          (Math.atan2(pointer.y - centre.y, pointer.x - centre.x) * 180) /
            Math.PI +
          90;

        cellsRef.current[i]?.style.setProperty("--magnet-angle", `${angle}deg`);
      }
    };

    const schedule = () => {
      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(render);
      }
    };

    const onPointerMove = (event: MouseEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      schedule();
    };

    const onScrollOrResize = () => {
      measure();
      schedule();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("mousemove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [rows, columns]);

  return (
    <div
      aria-hidden="true"
      className={`grid place-items-center select-none ${className}`}
      style={{
        width: containerSize,
        height: containerSize,
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          ref={(node) => {
            if (node) cellsRef.current[index] = node;
          }}
          className="flex items-center justify-center"
          style={{
            transform: `rotate(calc(var(--magnet-angle, ${baseAngle}deg)))`,
            transition: "transform 0.15s ease-out",
          }}
        >
          <span
            style={{
              display: "block",
              width: lineWidth,
              height: lineHeight,
              backgroundColor: lineColor,
              borderRadius: "999px",
            }}
          />
        </span>
      ))}
    </div>
  );
}
