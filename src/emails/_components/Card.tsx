import type { ReactNode } from "react";
import { Section } from "@react-email/components";

export function Card({ children }: { children: ReactNode }) {
  return (
    <Section
      style={{
        backgroundColor: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: 8,
        padding: 16,
      }}
    >
      {children}
    </Section>
  );
}
