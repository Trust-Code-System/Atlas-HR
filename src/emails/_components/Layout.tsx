import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export function Layout({
  preview,
  children,
  unsubscribeUrl,
  unsubscribeLabel,
}: {
  preview?: string;
  children: ReactNode;
  unsubscribeUrl?: string;
  unsubscribeLabel?: string;
}) {
  return (
    <Html>
      <Head>
        <style>
          {`
            @media (prefers-color-scheme: dark) {
              .email-body { background-color: #0A0A0A !important; }
              .email-card { background-color: #111827 !important; }
              .email-text { color: #F8FAFC !important; }
            }
          `}
        </style>
      </Head>
      {preview && <Preview>{preview}</Preview>}
      <Body
        className="email-body"
        style={{
          backgroundColor: "#F8FAFC",
          fontFamily: "Inter, Arial, sans-serif",
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          className="email-card"
          style={{
            maxWidth: 560,
            margin: "40px auto",
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <Section style={{ padding: "32px 40px 24px", borderBottom: "1px solid #E2E8F0" }}>
            <Img
              src="https://atlashr.com/logo-email.png"
              width="120"
              height="32"
              alt="Atlas HR"
            />
          </Section>

          <Section style={{ padding: "32px 40px" }}>{children}</Section>

          <Hr style={{ borderColor: "#E2E8F0", margin: 0 }} />

          <Section style={{ padding: "24px 40px", backgroundColor: "#F8FAFC" }}>
            {unsubscribeUrl && (
              <>
                <Text style={{ fontSize: 12, color: "#64748B", margin: "0 0 12px" }}>
                  <Link href={unsubscribeUrl} style={{ color: "#3B82F6" }}>
                    Unsubscribe{unsubscribeLabel ? ` from ${unsubscribeLabel}` : ""}
                  </Link>
                </Text>
                <Hr style={{ borderColor: "#E2E8F0", margin: "0 0 12px" }} />
              </>
            )}
            <Text style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
              Atlas HR - Lagos, Nigeria
            </Text>
            <Text style={{ fontSize: 12, color: "#64748B", margin: "8px 0 0" }}>
              <Link href="https://atlashr.com" style={{ color: "#2563EB" }}>
                atlashr.com
              </Link>
              {" - "}
              <Link href="https://atlashr.com/privacy" style={{ color: "#2563EB" }}>
                Privacy
              </Link>
              {" - "}
              <Link href="https://atlashr.com/terms" style={{ color: "#2563EB" }}>
                Terms
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
