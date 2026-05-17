import { Button } from "../_components/Button";
import { Card } from "../_components/Card";
import { Heading } from "../_components/Heading";
import { Layout } from "../_components/Layout";
import { Paragraph } from "../_components/Paragraph";

export function TrialEnding({
  firstName,
  planName,
  endDate,
  amount,
  interval,
  dashboardUrl,
  billingUrl,
}: {
  firstName: string;
  planName: string;
  endDate: string;
  amount: string;
  interval: string;
  dashboardUrl: string;
  billingUrl: string;
}) {
  return (
    <Layout preview={`Your Atlas HR ${planName} trial ends on ${endDate}.`}>
      <Heading>Your Atlas HR {planName} trial ends soon</Heading>
      <Paragraph>Hi {firstName}, just a heads up: your free trial ends on {endDate}.</Paragraph>
      <Card>
        <Paragraph>
          What happens next: your card will be charged {amount} on {endDate} for {planName} ({interval}).
        </Paragraph>
        <Paragraph>
          You will keep unlimited generations, premium templates, full Copilot access, and document history.
        </Paragraph>
      </Card>
      <Button href={dashboardUrl}>Continue with Atlas HR</Button>
      <Paragraph>Cancel before charge: {billingUrl}</Paragraph>
      <Paragraph>Questions? Reply to this email.</Paragraph>
    </Layout>
  );
}

export default TrialEnding;
