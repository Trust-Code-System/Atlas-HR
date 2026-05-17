import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import { Layout } from "@/emails/_components/Layout";

export function TeamPricingMigration({
  firstName = "there",
  legacyUntil,
  currentMonthly,
  newMonthly,
  lockInUrl,
  billingUrl,
}: {
  firstName?: string;
  legacyUntil: string;
  currentMonthly: string;
  newMonthly: string;
  lockInUrl: string;
  billingUrl: string;
}) {
  return (
    <Layout preview="Atlas HR Team pricing update">
      <Heading>Team pricing update</Heading>
      <Text>Hi {firstName},</Text>
      <Text>
        We are updating Team plan pricing for new customers as Atlas HR becomes a fuller HRIS. Your current Team pricing is
        grandfathered through {legacyUntil}.
      </Text>
      <Section>
        <Text>Current monthly estimate: {currentMonthly}</Text>
        <Text>New monthly estimate after grandfathering: {newMonthly}</Text>
      </Section>
      <Text>
        If you prefer predictability, you can lock in two years at the current rate by moving to an annual commitment before
        the grandfathering period ends.
      </Text>
      <Button href={lockInUrl}>Review lock-in option</Button>
      <Hr />
      <Text>
        You can review your billing details any time here: <a href={billingUrl}>billing settings</a>.
      </Text>
    </Layout>
  );
}

export default TeamPricingMigration;
