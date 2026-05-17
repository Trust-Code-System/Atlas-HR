import { Button } from "../_components/Button";
import { Heading } from "../_components/Heading";
import { Layout } from "../_components/Layout";
import { Paragraph } from "../_components/Paragraph";

export function InviteAccepted({
  inviteeName,
  orgName,
  seatCount,
  seatBreakdown,
  teamUrl,
}: {
  inviteeName: string;
  orgName: string;
  seatCount: number;
  seatBreakdown: string;
  teamUrl: string;
}) {
  return (
    <Layout preview={`${inviteeName} joined your team on Atlas HR.`}>
      <Heading>{inviteeName} joined your team</Heading>
      <Paragraph>
        {inviteeName} accepted your invitation and is now part of {orgName}.
      </Paragraph>
      <Paragraph>
        Your team now has {seatCount} seats. {seatBreakdown}
      </Paragraph>
      <Button href={teamUrl}>View team</Button>
    </Layout>
  );
}

export default InviteAccepted;
