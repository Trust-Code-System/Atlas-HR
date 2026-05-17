import { Button } from "../_components/Button";
import { Heading } from "../_components/Heading";
import { Layout } from "../_components/Layout";
import { Paragraph } from "../_components/Paragraph";

export function SubscriptionReactivated({
  planName,
  nextBilling,
  dashboardUrl,
}: {
  planName: string;
  nextBilling: string;
  dashboardUrl: string;
}) {
  return (
    <Layout preview={`Your Atlas HR ${planName} subscription is active again.`}>
      <Heading>Welcome back to Atlas HR {planName}</Heading>
      <Paragraph>Your {planName} subscription is reactivated.</Paragraph>
      <Paragraph>Your next billing date is {nextBilling}.</Paragraph>
      <Button href={dashboardUrl}>Go to dashboard</Button>
    </Layout>
  );
}

export default SubscriptionReactivated;
