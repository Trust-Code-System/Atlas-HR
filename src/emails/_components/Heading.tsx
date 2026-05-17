import type { ReactNode } from "react";
import { Heading as EmailHeading } from "@react-email/components";

export function Heading({
  children,
  level = 1,
}: {
  children: ReactNode;
  level?: 1 | 2;
}) {
  return (
    <EmailHeading
      as={level === 1 ? "h1" : "h2"}
      className="email-text"
      style={{
        color: "#0F172A",
        fontSize: level === 1 ? 24 : 18,
        lineHeight: level === 1 ? "32px" : "26px",
        fontWeight: 700,
        margin: "0 0 16px",
      }}
    >
      {children}
    </EmailHeading>
  );
}
