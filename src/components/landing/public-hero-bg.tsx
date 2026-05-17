/**
 * Decorative 3-D background for public page hero sections.
 * Drop inside a `relative overflow-hidden` <section> with bg-navy-950.
 * All children are absolutely positioned and pointer-events-none.
 */
export function PublicHeroBg() {
  return (
    <div aria-hidden className="pointer-events-none select-none">
      {/* Primary glow — top centre */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.22),transparent_70%)]" />
      {/* Secondary glow — bottom right */}
      <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(30,64,175,0.16),transparent_70%)]" />
      {/* Tertiary accent — top left */}
      <div className="absolute -top-24 -left-24 h-[300px] w-[300px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.10),transparent_70%)]" />

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:36px_36px]" />

      {/* Concentric rings — top right */}
      <svg
        className="absolute -top-16 -right-16 opacity-[0.07]"
        width="480"
        height="480"
        viewBox="0 0 480 480"
        fill="none"
      >
        <circle cx="480" cy="0" r="100" stroke="white" strokeWidth="1" />
        <circle cx="480" cy="0" r="160" stroke="white" strokeWidth="1" />
        <circle cx="480" cy="0" r="230" stroke="white" strokeWidth="1" />
        <circle cx="480" cy="0" r="310" stroke="white" strokeWidth="1" />
        <circle cx="480" cy="0" r="400" stroke="white" strokeWidth="1" />
      </svg>

      {/* Floating dot cluster — bottom left */}
      <svg
        className="absolute bottom-6 left-6 opacity-[0.09]"
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="white"
      >
        {Array.from({ length: 6 }).map((_, row) =>
          Array.from({ length: 6 }).map((_, col) => (
            <circle key={`${row}-${col}`} cx={col * 20 + 10} cy={row * 20 + 10} r="1.5" />
          ))
        )}
      </svg>

      {/* Diagonal highlight beam */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03)_0%,transparent_50%,rgba(59,130,246,0.04)_100%)]" />

      {/* Bottom fade to content area */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-linear-to-b from-transparent to-navy-950/40" />
    </div>
  );
}
