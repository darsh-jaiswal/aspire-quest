"use client";

import { useEffect, useRef } from "react";

interface DitherGradientProps {
  /** Edge length of one dithered cell, in CSS pixels. */
  pixelSize?: number;
  /** Colours sampled per lit cell. */
  colors?: string[];
  /** Cells per second of drift. 0 renders a single static frame. */
  speed?: number;
  /** "down" fades out toward the bottom, "up" toward the top. */
  direction?: "up" | "down";
  className?: string;
}

const DEFAULT_COLORS = ["#f7f7f4"];

/**
 * A gradient rendered as discrete cells rather than a smooth blend: cell
 * density follows the gradient ramp, so the band dissolves into its ground.
 *
 * The threshold comes from a 4x4 Bayer matrix rather than `Math.random()`.
 * Random thresholding gives noise that visibly boils between frames; ordered
 * dithering gives the stable cross-hatch texture the technique is named for,
 * and only drifts when we advance the sampling offset.
 */
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16));

export function DitherGradient({
  pixelSize = 3,
  colors = DEFAULT_COLORS,
  speed = 2,
  direction = "down",
  className = "",
}: DitherGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colorKey = colors.join(",");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let animationFrameId = 0;
    const step = Math.max(1, pixelSize);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /** Per-cell colour, stable across frames so the field doesn't strobe. */
    const colorAt = (col: number, row: number) => {
      const hash = (col * 73856093) ^ (row * 19349663);
      return colors[Math.abs(hash) % colors.length];
    };

    /**
     * @param phase advancing time in seconds; drives every moving part.
     */
    const paint = (phase: number) => {
      ctx.clearRect(0, 0, width, height);
      const rows = Math.ceil(height / step);
      const cols = Math.ceil(width / step);
      // Whole-matrix drift, so the cross-hatch itself crawls.
      const offset = Math.floor(phase * 4);

      for (let row = 0; row < rows; row += 1) {
        // Ramp runs 1 (solid) to 0 (empty) across the band.
        const t = row / Math.max(1, rows - 1);
        const density = direction === "down" ? 1 - t : t;
        // Ease so the solid end holds longer and the tail thins out.
        const base = density * density;

        for (let col = 0; col < cols; col += 1) {
          // A slow diagonal wave breathes the dissolve edge in and out
          // instead of leaving it pinned at a fixed row.
          const wave =
            Math.sin(phase * 1.6 + col * 0.06 + row * 0.12) * 0.5 +
            Math.sin(phase * 0.9 - col * 0.03) * 0.25;
          const ramp = base + wave * 0.16 * base;
          if (ramp <= 0) continue;

          const threshold =
            BAYER_4X4[(row + offset) & 3][(col + (offset >> 1)) & 3];
          if (ramp <= threshold) continue;

          ctx.fillStyle = colorAt(col, row);
          ctx.globalAlpha = Math.max(0, Math.min(1, 0.35 + ramp * 0.65));
          ctx.fillRect(col * step, row * step, step, step);
        }
      }
      ctx.globalAlpha = 1;
    };

    resize();
    window.addEventListener("resize", resize);

    if (reduceMotion || speed <= 0) {
      paint(0);
      return () => window.removeEventListener("resize", resize);
    }

    // Repaint on a fixed cadence rather than every frame: this is a chunky
    // pixel effect, and a 60fps redraw of thousands of fillRects buys no
    // visible smoothness for a lot of main-thread time.
    const FPS = 24;
    const msPerFrame = 1000 / FPS;
    let last = performance.now();
    const start = last;

    const draw = (now: number) => {
      if (now - last >= msPerFrame) {
        last = now;
        paint(((now - start) / 1000) * speed);
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    paint(0);
    animationFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pixelSize, colorKey, speed, direction]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`block h-full w-full ${className}`}
    />
  );
}
