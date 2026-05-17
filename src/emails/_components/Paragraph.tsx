import type { ReactNode } from "react";
import { Text } from "@react-email/components";

export function Paragraph({ children }: { children: ReactNode }) {
  return (
    <Text
      className="email-text"
      style={{
        color: "#334155",
        fontSize: 14,
        lineHeight: "24px",
        margin: "0 0 16px",
      }}
    >
      {children}
    </Text>
  );
}
