import { Button } from "../_components/Button";
import { Heading } from "../_components/Heading";
import { Layout } from "../_components/Layout";
import { Paragraph } from "../_components/Paragraph";

export function SubscriptionUpgraded({
  newPlanName,
  newFeatures,
  prorated,
  dashboardUrl,
}: {
  newPlanName: string;
  newFeatures: string;
  prorated: string;
  dashboardUrl: string;
}) {
  return (
    <Layout preview={`You are now on Atlas HR ${newPlanName}.`}>
      <Heading>Welcome to {newPlanName}</Heading>
      <Paragraph>You are now on {newPlanName}.</Paragraph>
      <Paragraph>What is new: {newFeatures}</Paragraph>
      <Paragraph>Prorated charge: {prorated}</Paragraph>
      <Button href={dashboardUrl}>Explore your new features</Button>
    </Layout>
  );
}

export default SubscriptionUpgraded;
