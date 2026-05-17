import type { ReactNode } from "react";
import { Link } from "@react-email/components";

const variants = {
  primary: {
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    border: "1px solid #2563EB",
  },
  secondary: {
    backgroundColor: "#FFFFFF",
    color: "#2563EB",
    border: "1px solid #BFDBFE",
  },
};

export function Button({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
}) {
  return (
    <Link
      href={href}
      style={{
        ...variants[variant],
        display: "inline-block",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 700,
        lineHeight: "20px",
        padding: "11px 18px",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}
