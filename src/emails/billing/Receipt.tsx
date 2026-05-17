import { Button } from "../_components/Button";
import { Card } from "../_components/Card";
import { Heading } from "../_components/Heading";
import { Layout } from "../_components/Layout";
import { Paragraph } from "../_components/Paragraph";

type LineItem = { description: string; amount: string };

export function Receipt({
  amount,
  lineItems,
  paymentMethod,
  periodStart,
  periodEnd,
  tax,
  invoicePdf,
}: {
  amount: string;
  lineItems: LineItem[];
  paymentMethod: string;
  periodStart: string;
  periodEnd: string;
  tax: string;
  invoicePdf: string;
}) {
  return (
    <Layout preview={`Payment received: ${amount}.`}>
      <Heading>Your Atlas HR receipt</Heading>
      <Paragraph>Payment received.</Paragraph>
      <Card>
        {lineItems.map((item) => (
          <Paragraph key={`${item.description}-${item.amount}`}>
            {item.description}: {item.amount}
          </Paragraph>
        ))}
        <Paragraph>Tax: {tax}</Paragraph>
        <Paragraph>Total: {amount}</Paragraph>
        <Paragraph>Paid with {paymentMethod}</Paragraph>
        <Paragraph>Period: {periodStart} - {periodEnd}</Paragraph>
      </Card>
      {invoicePdf && <Button href={invoicePdf}>Download invoice</Button>}
    </Layout>
  );
}

export default Receipt;
