import { Link } from "@react-email/components";
import { Button } from "../_components/Button";
import { Heading } from "../_components/Heading";
import { Layout } from "../_components/Layout";
import { Paragraph } from "../_components/Paragraph";

export function MagicLink({ signInUrl }: { signInUrl: string }) {
  return (
    <Layout preview="Your Atlas HR sign-in link.">
      <Heading>Your sign-in link</Heading>
      <Paragraph>Click below to sign in to Atlas HR.</Paragraph>
      <Button href={signInUrl}>Sign in</Button>
      <Paragraph>Expires in 10 minutes. Single use.</Paragraph>
      <Paragraph>
        Did not request this? Ignore this email. Fallback link:{" "}
        <Link href={signInUrl} style={{ color: "#2563EB" }}>
          {signInUrl}
        </Link>
      </Paragraph>
    </Layout>
  );
}

export default MagicLink;
