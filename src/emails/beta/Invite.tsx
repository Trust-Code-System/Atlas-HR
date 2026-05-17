import { Button } from "../_components/Button";
import { Heading } from "../_components/Heading";
import { Layout } from "../_components/Layout";
import { Paragraph } from "../_components/Paragraph";

export function BetaInviteEmail({
  inviteUrl,
  code,
  personalNote,
}: {
  inviteUrl: string;
  code: string;
  personalNote?: string | null;
}) {
  return (
    <Layout preview="You're invited to the Atlas HR private beta">
      <Heading>You&apos;re invited to the Atlas HR private beta</Heading>
      <Paragraph>Hi there,</Paragraph>
      <Paragraph>
        {personalNote ??
          "I am inviting a small group of HR professionals to try Atlas HR before public launch and tell us where the product needs to be sharper."}
      </Paragraph>
      <Paragraph>
        The beta includes the Knowledge Hub, document generators, templates, Atlas Copilot,
        community, and early Mini-HRIS workflows. You also get three months of Pro access
        while we learn from your feedback.
      </Paragraph>
      <Paragraph>
        Your invite code is <strong>{code}</strong>. In return, we ask for honest feedback,
        bug reports when something breaks, and a short conversation if you are open to it.
      </Paragraph>
      <Button href={inviteUrl}>Claim your spot</Button>
      <Paragraph>
        If the button does not work, open this link: {inviteUrl}
      </Paragraph>
    </Layout>
  );
}

export default BetaInviteEmail;
