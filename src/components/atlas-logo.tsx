import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

type AtlasLogoMarkProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

export function AtlasLogoMark({ className, title, ...props }: AtlasLogoMarkProps) {
  const titleId = title ? "atlas-logo-title" : undefined;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-labelledby={titleId}
      className={className}
      {...props}
    >
      {title && <title id={titleId}>{title}</title>}
      <defs>
        {/* Deep base gradient — dark navy → vivid blue → cyan */}
        <linearGradient id="alm-bg" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#060E1F" />
          <stop offset="48%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>

        {/* Bottom-depth darkener — makes the lower half recede */}
        <linearGradient id="alm-depth" x1="32" y1="26" x2="32" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="black" stopOpacity="0" />
          <stop offset="1" stopColor="black" stopOpacity="0.32" />
        </linearGradient>

        {/* Glass sheen — bright top-left sweeping to transparent */}
        <linearGradient id="alm-sheen" x1="4" y1="4" x2="38" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.38" />
          <stop offset="55%" stopColor="white" stopOpacity="0.04" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        {/* Specular hotspot — concentrated reflection at top-left */}
        <radialGradient id="alm-specular" cx="17" cy="13" r="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.52" />
          <stop offset="60%" stopColor="white" stopOpacity="0.08" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>

        {/* Border gradient — bright top-left, fades clockwise */}
        <linearGradient id="alm-border" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.7" />
          <stop offset="45%" stopColor="white" stopOpacity="0.18" />
          <stop offset="100%" stopColor="white" stopOpacity="0.04" />
        </linearGradient>

        {/* Mark (A-shape) gradient */}
        <linearGradient id="alm-mark" x1="18" y1="17" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#BAE6FD" />
        </linearGradient>

        {/* Drop shadow below icon */}
        <filter id="alm-shadow" x="-20%" y="-10%" width="140%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#1E3A8A" floodOpacity="0.55" />
        </filter>

        {/* Soft glow for the three accent dots */}
        <filter id="alm-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Elevation shadow behind the shape ──────────────────── */}
      <rect x="6" y="9" width="52" height="52" rx="15" fill="#1D4ED8" opacity="0.22" />

      {/* ── Base shape ─────────────────────────────────────────── */}
      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#alm-bg)" filter="url(#alm-shadow)" />

      {/* ── Bottom-depth darkener ───────────────────────────────── */}
      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#alm-depth)" />

      {/* ── Glass sheen surface ─────────────────────────────────── */}
      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#alm-sheen)" />

      {/* ── Specular highlight blob ─────────────────────────────── */}
      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#alm-specular)" />

      {/* ── Inner border — catches rim light ────────────────────── */}
      <rect x="4.8" y="4.8" width="54.4" height="54.4" rx="15.4" stroke="url(#alm-border)" strokeWidth="1.4" fill="none" />

      {/* ── Top-edge catchlight (thin bright line along top rim) ── */}
      <path d="M18 5.4 Q32 4.6 46 5.4" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />

      {/* ── Corner glint (brightest reflection point) ───────────── */}
      <ellipse cx="14" cy="12" rx="7" ry="4.5" fill="white" opacity="0.22" transform="rotate(-30 14 12)" />

      {/* ── A mark — inset shadow for depth ─────────────────────── */}
      <path
        d="M18 45.5 31.9 17.5 46 45.5"
        stroke="rgba(0,10,40,0.4)"
        strokeWidth="6.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(0.7 1.3)"
      />
      {/* ── A mark ──────────────────────────────────────────────── */}
      <path
        d="M18 45.5 31.9 17.5 46 45.5"
        stroke="url(#alm-mark)"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Crossbar inset shadow ────────────────────────────────── */}
      <path d="M24.7 34.6h14.6" stroke="rgba(0,10,40,0.4)" strokeWidth="6" strokeLinecap="round" transform="translate(0.7 1.3)" />
      {/* ── Crossbar ─────────────────────────────────────────────── */}
      <path d="M24.7 34.6h14.6" stroke="white" strokeWidth="4.6" strokeLinecap="round" />

      {/* ── Globe arc decorations ────────────────────────────────── */}
      <path
        d="M14.6 21.5c5.1-5.8 11.1-8.7 17.4-8.7 6.4 0 12.3 2.9 17.4 8.7"
        stroke="#93C5FD"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M14.6 42.5c5.1 5.8 11.1 8.7 17.4 8.7 6.4 0 12.3-2.9 17.4-8.7"
        stroke="#93C5FD"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* ── Accent dots with luminous glow ──────────────────────── */}
      <circle cx="32" cy="17.5" r="3.2" fill="white" filter="url(#alm-glow)" />
      <circle cx="18" cy="45.5" r="3.2" fill="#DBEAFE" filter="url(#alm-glow)" />
      <circle cx="46" cy="45.5" r="3.2" fill="#DBEAFE" filter="url(#alm-glow)" />
    </svg>
  );
}

export function AtlasLogo({
  className,
  markClassName,
  textClassName,
  compact = false,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <AtlasLogoMark className={cn("h-8 w-8 shrink-0", markClassName)} />
      {!compact && (
        <span className={cn("font-extrabold tracking-tight text-navy-900", textClassName)}>
          Atlas <span className="text-blue-600">HR</span>
        </span>
      )}
    </span>
  );
}
