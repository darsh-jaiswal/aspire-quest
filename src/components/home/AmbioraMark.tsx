/**
 * The Ambiora mark, redrawn as a component.
 *
 * The fest's logo is a circle enclosing a triangular "A" with dot terminals at
 * its three vertices. That split — a fixed ring around a pointing triangle —
 * is why it works as the hero's interactive element: the ring holds station
 * while the triangle inside it turns. Nothing here is decorative; the whole
 * mark is the logo's own geometry.
 *
 * Purely presentational and server-renderable. Rotation is applied by the
 * parent through the `--mark-angle` custom property, so this component never
 * needs to know where the pointer is.
 */
export function AmbioraMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* The ring: fixed. */}
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />

      {/* The pointing triangle, turned by the parent. Rotating a group inside
          the SVG (rather than the whole element) keeps the ring perfectly
          concentric no matter the angle. */}
      <g
        style={{ transform: "rotate(var(--mark-angle, 0deg))" }}
        className="origin-center transition-transform duration-500 ease-out motion-reduce:transition-none"
      >
        <path
          d="M50 22 L26 68 L74 55 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Dot terminals, as in the logo. */}
        <circle cx="50" cy="22" r="5" fill="currentColor" />
        <circle cx="26" cy="68" r="5" fill="currentColor" />
        <circle cx="74" cy="55" r="5" fill="currentColor" />
      </g>
    </svg>
  );
}
