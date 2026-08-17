"use client";

import { useEffect, useRef } from "react";

type Variant = "default" | "icon" | "glow";

interface PixelCanvasProps {
  variant?: Variant;
  colors?: string[];
  gap?: number;
  speed?: number;
  className?: string;
}

interface Pixel {
  x: number;
  y: number;
  color: string;
  size: number;
  maxSize: number;
  /** Phase offset so the field shimmers rather than pulsing in unison. */
  phase: number;
  /** Eased 0–1 brightness, so pixels fade rather than snap. */
  intensity: number;
}

const DEFAULT_COLORS = ["#22c55e", "#10b981", "#14b8a6", "#06b6d4"];

/** How far the cursor's influence reaches, in CSS pixels. */
const REVEAL_RADIUS = 190;
/**
 * Resting brightness away from the cursor. Kept high enough that a pixel is
 * still a visible sub-pixel of texture at rest — drop this much below ~0.2
 * and the field disappears entirely until the cursor arrives.
 */
const AMBIENT = 0.22;

/**
 * A field of pixels that shimmer in and out. Sized to its parent, so it works
 * as a full-bleed background layer.
 *
 * The canvas is transparent — it composites over whatever sits behind it and
 * under whatever sits above, which is what lets the magnet-line field read on
 * top of it in the masthead.
 */
export function PixelCanvas({
  variant = "default",
  colors = DEFAULT_COLORS,
  gap = 10,
  speed = 0.01,
  className = "",
}: PixelCanvasProps) {
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
    let pixels: Pixel[] = [];
    let animationFrameId: number;
    const pointer = { x: -10000, y: -10000 };

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const step = Math.max(4, gap);
      pixels = [];
      for (let x = 0; x < width; x += step) {
        for (let y = 0; y < height; y += step) {
          pixels.push({
            x,
            y,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 0,
            maxSize: variant === "icon" ? step * 0.5 : step * 0.4,
            phase: Math.random() * Math.PI * 2,
            intensity: 0,
          });
        }
      }
    };

    build();
    window.addEventListener("resize", build);

    // Tracked on the window rather than the canvas: this renders as a
    // background layer under `pointer-events-none` wrappers, so it would
    // never receive events of its own.
    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const handleLeave = () => {
      pointer.x = -10000;
      pointer.y = -10000;
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("mousemove", handleMove, { passive: true });
    document.addEventListener("mouseleave", handleLeave);

    const paint = (t: number) => {
      ctx.clearRect(0, 0, width, height);

      const { x: px, y: py } = pointer;
      const radiusSq = REVEAL_RADIUS * REVEAL_RADIUS;

      for (const p of pixels) {
        // Proximity drives the reveal: pixels near the cursor light up, the
        // rest keep a low ambient shimmer so the field never looks dead.
        const dx = p.x - px;
        const dy = p.y - py;
        const proximity =
          px < -9000 ? 0 : Math.max(0, 1 - (dx * dx + dy * dy) / radiusSq);

        const shimmer = 0.5 + 0.5 * Math.sin(t * speed * 0.6 + p.phase);
        const target = AMBIENT + proximity * shimmer * (1 - AMBIENT) * 4;

        // Ease toward the target so pixels fade in and out instead of
        // snapping as the cursor sweeps past.
        p.intensity += (Math.min(1, target) - p.intensity) * 0.12;
        if (p.intensity <= 0.02) continue;

        p.size = p.maxSize * p.intensity;
        ctx.globalAlpha = Math.min(1, 0.9 * p.intensity);
        ctx.fillStyle = p.color;

        if (variant === "glow") {
          ctx.shadowBlur = 12 * p.intensity;
          ctx.shadowColor = p.color;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };

    const cleanup = () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", build);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
    };

    if (reduceMotion) {
      // One static frame so the texture still exists, with no loop running.
      // Pixels settle at ambient rather than tracking the cursor.
      for (const p of pixels) p.intensity = AMBIENT;
      paint(0);
      return cleanup;
    }

    const draw = (t: number) => {
      paint(t);
      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    return cleanup;
    // `colors` is keyed by content: an inline array literal is a fresh
    // reference on every render and would otherwise rebuild the field each
    // time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, colorKey, gap, speed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`block h-full w-full ${className}`}
    />
  );
}
