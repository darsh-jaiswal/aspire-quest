"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * The Ambiora mark, built in three dimensions and turned by hand.
 *
 * The geometry is the logo's own: a ring, a triangular "A" made of three bars,
 * and a dot at each vertex. Nothing is invented for the sake of looking
 * three-dimensional — it is the same construction as `AmbioraMark`, extruded.
 *
 * No external assets. The material is lit by three hand-placed lights rather
 * than an HDR environment map, because the site's CSP allows no external
 * origins and an environment map would have to be fetched. Hand-placed lights
 * also keep the highlights where they belong: along the ring's crown, which is
 * what makes it read as round.
 *
 * This module is only ever reached through a lazy import (see Masthead), so
 * three.js stays out of the initial bundle and off the critical path.
 */

/* The mark's vertices, in the same proportions as the flat SVG. */
const APEX = new THREE.Vector3(0, 1.12, 0);
const LEFT = new THREE.Vector3(-0.96, -0.72, 0);
const RIGHT = new THREE.Vector3(0.96, -0.2, 0);

const BAR_THICKNESS = 0.1;
const DEPTH = 0.22;

/** One edge of the triangle, as a box stretched and turned between two points. */
function Bar({ from, to }: { from: THREE.Vector3; to: THREE.Vector3 }) {
  const { position, rotation, length } = useMemo(() => {
    const delta = new THREE.Vector3().subVectors(to, from);
    return {
      length: delta.length(),
      position: new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5),
      rotation: new THREE.Euler(0, 0, Math.atan2(delta.y, delta.x)),
    };
  }, [from, to]);

  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={[length, BAR_THICKNESS, DEPTH]} />
      <MarkMaterial />
    </mesh>
  );
}

/** Shared surface: dark, lacquered, with a tight specular roll-off. */
function MarkMaterial() {
  return (
    <meshPhysicalMaterial
      color="#151515"
      metalness={0.45}
      roughness={0.14}
      clearcoat={1}
      clearcoatRoughness={0.08}
      reflectivity={1}
    />
  );
}

function Mark() {
  const groupRef = useRef<THREE.Group>(null);
  const { size } = useThree();

  // Target rotation, driven by drag; the mesh eases toward it every frame so a
  // flick settles instead of stopping dead.
  const target = useRef({ x: -0.15, y: 0.4 });
  const velocity = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      dragging.current = true;
      last.current = { x: event.clientX, y: event.clientY };
    };

    const onMove = (event: PointerEvent) => {
      if (!dragging.current || !last.current) return;
      const dx = event.clientX - last.current.x;
      const dy = event.clientY - last.current.y;
      last.current = { x: event.clientX, y: event.clientY };

      // Scale by viewport so the same gesture turns the mark by the same
      // amount on a phone as on a desktop.
      velocity.current.y = (dx / size.width) * 6;
      velocity.current.x = (dy / size.height) * 6;
      target.current.y += velocity.current.y;
      target.current.x += velocity.current.x;
    };

    const onUp = () => {
      dragging.current = false;
      last.current = null;
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [size.width, size.height]);

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // Idle drift, so the object is alive before anyone touches it. Stops while
    // the pointer is down so a drag feels direct.
    if (!dragging.current) {
      target.current.y += delta * 0.22;
      velocity.current.x *= 0.9;
      velocity.current.y *= 0.9;
    }

    // Clamp the vertical tumble: past a right angle the mark reads as a line.
    target.current.x = THREE.MathUtils.clamp(target.current.x, -0.9, 0.9);

    group.rotation.y += (target.current.y - group.rotation.y) * 0.08;
    group.rotation.x += (target.current.x - group.rotation.x) * 0.08;
  });

  return (
    <group ref={groupRef} scale={1.05}>
      {/* The ring. */}
      <mesh castShadow receiveShadow>
        <torusGeometry args={[1.68, 0.075, 24, 96]} />
        <MarkMaterial />
      </mesh>

      {/* The triangular A. */}
      <Bar from={APEX} to={LEFT} />
      <Bar from={LEFT} to={RIGHT} />
      <Bar from={RIGHT} to={APEX} />

      {/* Dot terminals. */}
      {[APEX, LEFT, RIGHT].map((point, index) => (
        <mesh key={index} position={point} castShadow receiveShadow>
          <sphereGeometry args={[0.15, 32, 32]} />
          <MarkMaterial />
        </mesh>
      ))}
    </group>
  );
}

/**
 * A machine without WebGL should get nothing here rather than a blank canvas,
 * so the flat mark behind it stays visible.
 *
 * Computed in a lazy initialiser instead of an effect: this module is only
 * ever reached through a dynamic import with `ssr: false`, so it never runs
 * during server rendering and `document` is always available.
 */
function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function AmbioraObject() {
  const [supported] = useState(detectWebGL);

  if (!supported) return null;

  return (
    <Canvas
      camera={{ position: [0, 0, 6.4], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "pan-y" }}
    >
      {/* Enough fill to keep the silhouette from going solid black, no more. */}
      <ambientLight intensity={0.35} />

      {/* Key: the highlight that rides the crown of the ring. */}
      <directionalLight position={[4, 6, 5]} intensity={2.6} />

      {/* Rim, from behind and below. On a near-black object against a near-black
          ground this is the light doing the most work — without it the mark
          dissolves into the section rather than sitting in front of it. */}
      <pointLight position={[-5, -3, -4]} intensity={55} distance={22} />

      {/* A soft second key stops the lower left from reading as a dead zone. */}
      <pointLight position={[-3, 2, 4]} intensity={16} distance={18} />

      <Mark />
    </Canvas>
  );
}
