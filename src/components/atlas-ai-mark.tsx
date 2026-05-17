import type { SVGProps } from "react";

export function AtlasAiMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M12 2.75 19.75 7.25v9.5L12 21.25 4.25 16.75v-9.5L12 2.75Z"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <path
        d="M7.6 16.2 12 7.55l4.4 8.65M9.55 13.05h4.9"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={12} cy={7.55} r={1.15} fill="currentColor" />
      <circle cx={7.6} cy={16.2} r={1.15} fill="currentColor" />
      <circle cx={16.4} cy={16.2} r={1.15} fill="currentColor" />
      <path
        d="M17.2 5.15v2.25M16.08 6.28h2.24"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </svg>
  );
}
