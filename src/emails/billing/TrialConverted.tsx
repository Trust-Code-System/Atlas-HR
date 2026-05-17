import { Button } from "../_components/Button";
import { Card } from "../_components/Card";
import { Heading } from "../_components/Heading";
import { Layout } from "../_components/Layout";
import { Paragraph } from "../_components/Paragraph";

export function TrialConverted({
  planName,
  nextBilling,
  amount,
  invoiceUrl,
  dashboardUrl,
}: {
  planName: string;
  nextBilling: string;
  amount: string;
  invoiceUrl: string;
  dashboardUrl: string;
}) {
  return (
    <Layout preview={`Your Atlas HR ${planName} trial has converted to paid.`}>
      <Heading>Welcome to Atlas HR {planName}</Heading>
      <Paragraph>Your trial has converted to a paid subscription. Payment is confirmed.</Paragraph>
      <Card>
        <Paragraph>Plan: {planName}</Paragraph>
        <Paragraph>Next billing date: {nextBilling}</Paragraph>
        <Paragraph>Amount: {amount}</Paragraph>
        {invoiceUrl && <Paragraph>Invoice: {invoiceUrl}</Paragraph>}
      </Card>
      <Paragraph>Next, try premium templates, full Copilot, and saved document history.</Paragraph>
      <Button href={dashboardUrl}>Open Atlas HR</Button>
    </Layout>
  );
}

export default TrialConverted;
