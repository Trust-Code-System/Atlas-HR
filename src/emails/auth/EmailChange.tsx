import { Button } from "../_components/Button";
import { Heading } from "../_components/Heading";
import { Layout } from "../_components/Layout";
import { Paragraph } from "../_components/Paragraph";

export function EmailChange({
  newEmail,
  confirmUrl,
  securityUrl,
}: {
  newEmail: string;
  confirmUrl: string;
  securityUrl: string;
}) {
  return (
    <Layout preview="Confirm your new Atlas HR email.">
      <Heading>Confirm your new email</Heading>
      <Paragraph>You requested to change your Atlas HR email to {newEmail}.</Paragraph>
      <Paragraph>If this was you, click below to confirm.</Paragraph>
      <Button href={confirmUrl}>Confirm new email</Button>
      <Paragraph>
        If this was not you, your account may be compromised. Reset your password immediately from your security settings.
      </Paragraph>
      <Button href={securityUrl} variant="secondary">Open security settings</Button>
    </Layout>
  );
}

export default EmailChange;
