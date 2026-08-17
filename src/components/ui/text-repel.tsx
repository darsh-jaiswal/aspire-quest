"use client";

import { useEffect, useRef } from "react";

interface TextRepelProps {
  text: string;
  className?: string;
  /** Spring stiffness pulling a letter back to rest. Higher = snappier. */
  stiffness?: number;
  /** Velocity resistance. Lower = more oscillation (jellier). */
  damping?: number;
  /** Inertia multiplier — higher mass overshoots and wobbles more. */
  mass?: number;
  /**
   * Repulsion force applied within the pointer's radius. Peak displacement
   * of a letter is roughly `strength / stiffness` pixels, so these two want
   * to be chosen together — a small strength against a large stiffness moves
   * the glyph a fraction of a pixel and reads as nothing happening.
   */
  strength?: number;
  /**
   * Pointer influence radius in pixels. Defaults to scaling with the
   * rendered text height, so a display-sized wordmark gets a proportionally
   * large field instead of a fixed one that barely reaches the glyphs.
   */
  radius?: number;
}

interface Letter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
}

/**
 * Splits `text` into per-character spans that spring away from the cursor
 * and settle back to their resting position, via a damped harmonic
 * oscillator per glyph.
 */
export function TextRepel({
  text,
  className = "",
  stiffness = 170,
  damping = 26,
  mass = 1,
  strength = 900,
  radius,
}: TextRepelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const letterElsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const lettersRef = useRef<Letter[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const pointer = { x: -10000, y: -10000, radius: radius ?? 140 };

    const measure = () => {
      const containerRect = container.getBoundingClientRect();
      // Scale the influence field to the rendered type unless the caller
      // pinned it explicitly.
      if (radius === undefined) {
        pointer.radius = Math.max(140, containerRect.height * 1.4);
      }
      lettersRef.current = letterElsRef.current.map((el) => {
        if (!el) return { x: 0, y: 0, vx: 0, vy: 0, baseX: 0, baseY: 0 };
        const rect = el.getBoundingClientRect();
        const baseX = rect.left + rect.width / 2 - containerRect.left;
        const baseY = rect.top + rect.height / 2 - containerRect.top;
        return { x: baseX, y: baseY, vx: 0, vy: 0, baseX, baseY };
      });
    };

    measure();
    window.addEventListener("resize", measure);

    if (reduceMotion) {
      return () => window.removeEventListener("resize", measure);
    }

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const handlePointerLeave = () => {
      pointer.x = -10000;
      pointer.y = -10000;
    };

    // Listen on both: real browsers fire pointermove, but some automation
    // and older input stacks only dispatch mousemove.
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("mousemove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);
    container.addEventListener("mouseleave", handlePointerLeave);

    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      lettersRef.current.forEach((letter, i) => {
        const dx = pointer.x - letter.x;
        const dy = pointer.y - letter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < pointer.radius && dist > 0) {
          const power = 1 - dist / pointer.radius;
          const force = power * strength;
          const angle = Math.atan2(dy, dx);
          letter.vx -= (Math.cos(angle) * force * dt) / mass;
          letter.vy -= (Math.sin(angle) * force * dt) / mass;
        }

        // Damped harmonic oscillator: acceleration = -(k*x + c*v) / m.
        // Low damping relative to critical (2*sqrt(k*m)) overshoots and
        // oscillates around rest — that's the "jelly" wobble.
        const dispX = letter.x - letter.baseX;
        const dispY = letter.y - letter.baseY;
        const accX = (-stiffness * dispX - damping * letter.vx) / mass;
        const accY = (-stiffness * dispY - damping * letter.vy) / mass;

        letter.vx += accX * dt;
        letter.vy += accY * dt;

        letter.x += letter.vx * dt;
        letter.y += letter.vy * dt;

        const el = letterElsRef.current[i];
        if (el) {
          const tx = letter.x - letter.baseX;
          const ty = letter.y - letter.baseY;
          el.style.transform = `translate(${tx}px, ${ty}px)`;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("mousemove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      container.removeEventListener("mouseleave", handlePointerLeave);
    };
  }, [text, stiffness, damping, mass, strength, radius]);

  return (
    <div ref={containerRef} className={`inline-block ${className}`}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          ref={(el) => {
            letterElsRef.current[i] = el;
          }}
          className="inline-block will-change-transform"
        >
          {char === " " ? " " : char}
        </span>
      ))}
    </div>
  );
}
