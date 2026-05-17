import { Link } from "@react-email/components";
import { Button } from "../_components/Button";
import { Heading } from "../_components/Heading";
import { Layout } from "../_components/Layout";
import { Paragraph } from "../_components/Paragraph";

export function VerifyEmail({
  firstName,
  verifyUrl,
}: {
  firstName: string;
  verifyUrl: string;
}) {
  return (
    <Layout preview="Verify your email to access Atlas HR.">
      <Heading>Verify your email</Heading>
      <Paragraph>Hi {firstName},</Paragraph>
      <Paragraph>Click the button below to verify your email and activate your Atlas HR account.</Paragraph>
      <Button href={verifyUrl}>Verify email</Button>
      <Paragraph>If you did not create an account, you can safely ignore this email.</Paragraph>
      <Paragraph>
        Link expires in 24 hours. If the button does not work, open this link:{" "}
        <Link href={verifyUrl} style={{ color: "#2563EB" }}>
          {verifyUrl}
        </Link>
      </Paragraph>
    </Layout>
  );
}

export default VerifyEmail;
