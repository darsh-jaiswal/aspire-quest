"use client";

import dynamic from "next/dynamic";
import { AmbioraMark } from "./AmbioraMark";
import { useMediaQuery } from "./useMediaQuery";

/**
 * Loads the three-dimensional mark, and decides whether to load it at all.
 *
 * three.js is heavy enough to matter on a page students will open on campus
 * wifi, so it is behind `next/dynamic` with `ssr: false`: the masthead's text
 * and the flat mark paint first, and the WebGL bundle arrives afterwards and
 * swaps in. Nothing above the fold waits on it.
 *
 * Two cases never load it:
 *   - `prefers-reduced-motion`, where a tumbling object is exactly what the
 *     setting is asking us not to do.
 *   - Coarse pointers with no hover — a phone — where the drag interaction has
 *     little to offer, the frame cost lands hardest, and the flat mark reads
 *     better at small sizes anyway.
 *
 * The static mark is the fallback in every case, so this degrades to the same
 * artwork rather than to a hole in the layout.
 */

const AmbioraObject = dynamic(() => import("./AmbioraObject"), {
  ssr: false,
  loading: () => <StaticMark />,
});

function StaticMark() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <AmbioraMark className="size-[min(58vw,26rem)] text-paper/70" />
    </div>
  );
}

export function AmbioraStage() {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const coarsePointer = useMediaQuery("(pointer: coarse)");

  // Both snapshots are false on the server, so the first paint is always the
  // static mark — the object only ever arrives as an upgrade.
  const enrich = !reduceMotion && !coarsePointer;

  return (
    <div className="h-full w-full">
      {enrich ? <AmbioraObject /> : <StaticMark />}
    </div>
  );
}
