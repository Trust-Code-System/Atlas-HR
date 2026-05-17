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
        <linearGradient id="atlas-logo-bg" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F172A" />
          <stop offset="0.45" stopColor="#2563EB" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="atlas-logo-accent" x1="18" y1="18" x2="46" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#BFDBFE" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#atlas-logo-bg)" />
      <path
        d="M18 45.5 31.9 17.5 46 45.5"
        stroke="url(#atlas-logo-accent)"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24.7 34.6h14.6"
        stroke="white"
        strokeWidth="4.6"
        strokeLinecap="round"
      />
      <path
        d="M14.6 21.5c5.1-5.8 11.1-8.7 17.4-8.7 6.4 0 12.3 2.9 17.4 8.7M14.6 42.5c5.1 5.8 11.1 8.7 17.4 8.7 6.4 0 12.3-2.9 17.4-8.7"
        stroke="#93C5FD"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx="32" cy="17.5" r="3.2" fill="white" />
      <circle cx="18" cy="45.5" r="3.2" fill="#DBEAFE" />
      <circle cx="46" cy="45.5" r="3.2" fill="#DBEAFE" />
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
