import { Button } from "../_components/Button";
import { Heading } from "../_components/Heading";
import { Layout } from "../_components/Layout";
import { Paragraph } from "../_components/Paragraph";

export function PaymentFailed({
  amount,
  planName,
  declineReason,
  retryDate,
  portalUrl,
}: {
  amount: string;
  planName: string;
  declineReason: string;
  retryDate: string;
  portalUrl: string;
}) {
  return (
    <Layout preview={`Your Atlas HR payment of ${amount} could not be processed.`}>
      <Heading>Action required: payment failed</Heading>
      <Paragraph>Your payment of {amount} for {planName} could not be processed.</Paragraph>
      <Paragraph>Reason: {declineReason}</Paragraph>
      <Paragraph>
        Stripe will retry on {retryDate}. To avoid losing access, please update your payment method now.
      </Paragraph>
      <Button href={portalUrl}>Update payment method</Button>
      <Paragraph>
        After repeated failed attempts, your subscription may be canceled and your account may return to the free plan.
      </Paragraph>
    </Layout>
  );
}

export default PaymentFailed;
