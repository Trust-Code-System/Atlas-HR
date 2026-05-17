import { Button } from "../_components/Button";
import { Heading } from "../_components/Heading";
import { Layout } from "../_components/Layout";
import { Paragraph } from "../_components/Paragraph";

export function Invite({
  inviterName,
  inviterEmail,
  orgName,
  industry,
  inviteUrl,
  unsubscribeUrl,
}: {
  inviterName: string;
  inviterEmail: string;
  orgName: string;
  industry?: string | null;
  inviteUrl: string;
  unsubscribeUrl?: string;
}) {
  return (
    <Layout preview={`${inviterName} invited you to ${orgName} on Atlas HR.`} unsubscribeUrl={unsubscribeUrl} unsubscribeLabel="Atlas HR invites">
      <Heading>{inviterName} invited you to {orgName}</Heading>
      <Paragraph>
        {inviterName} ({inviterEmail}) wants you to join their HR team on Atlas HR.
      </Paragraph>
      <Paragraph>
        {orgName}{industry ? ` - ${industry}` : ""} uses Atlas HR for HR guidance, document generation, and team workspace tools.
      </Paragraph>
      <Button href={inviteUrl}>Accept invitation</Button>
      <Paragraph>This invite expires in 7 days.</Paragraph>
      <Paragraph>If you do not recognise this invitation, you can safely ignore this email.</Paragraph>
    </Layout>
  );
}

export default Invite;
