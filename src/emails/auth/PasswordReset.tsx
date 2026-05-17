import { Link, Section, Text } from "@react-email/components";
import { Button } from "../_components/Button";
import { Heading } from "../_components/Heading";
import { Layout } from "../_components/Layout";
import { Paragraph } from "../_components/Paragraph";

export function PasswordReset({ resetUrl }: { resetUrl: string }) {
  return (
    <Layout preview="Reset your Atlas HR password.">
      <Section style={{ textAlign: "center" }}>
        <Text
          style={{
            color: "#2563EB",
            fontSize: 20,
            fontWeight: 700,
            lineHeight: "28px",
            margin: "0 0 24px",
          }}
        >
          Atlas HR
        </Text>
        <Section
          style={{
            backgroundColor: "#DBEAFE",
            borderRadius: 999,
            height: 64,
            margin: "0 auto 20px",
            width: 64,
          }}
        >
          <Text
            aria-hidden="true"
            style={{
              color: "#2563EB",
              fontSize: 30,
              fontWeight: 700,
              lineHeight: "64px",
              margin: 0,
              textAlign: "center",
            }}
          >
            ↺
          </Text>
        </Section>
        <Heading>Reset your password</Heading>
        <Paragraph>
          We received a request to reset the password for your Atlas HR account. If you
          didn&apos;t make this request, you can safely ignore this email.
        </Paragraph>
        <Section style={{ margin: "28px 0" }}>
          <Button href={resetUrl}>Reset password</Button>
        </Section>
      </Section>
      <Section
        style={{
          backgroundColor: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          margin: "0 auto 24px",
          maxWidth: 360,
          padding: 16,
        }}
      >
        <Text
          style={{
            color: "#475569",
            fontSize: 12,
            lineHeight: "18px",
            margin: 0,
          }}
        >
          For security, this link expires in 1 hour. If you need a new link, please
          visit the login page and request another password reset.
        </Text>
      </Section>
      <Paragraph>
        If the button doesn&apos;t work, copy and paste this fallback link into your
        browser:{" "}
        <Link href={resetUrl} style={{ color: "#2563EB" }}>
          {resetUrl}
        </Link>
      </Paragraph>
    </Layout>
  );
}

export default PasswordReset;
