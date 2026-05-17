import { Button } from "../_components/Button";
import { Heading } from "../_components/Heading";
import { Layout } from "../_components/Layout";
import { Paragraph } from "../_components/Paragraph";

export function SubscriptionCanceled({
  planName,
  periodEnd,
  immediate,
  billingUrl,
  feedbackUrl,
}: {
  planName: string;
  periodEnd: string;
  immediate: boolean;
  billingUrl: string;
  feedbackUrl: string;
}) {
  return (
    <Layout preview={`Your Atlas HR ${planName} subscription is canceled.`}>
      <Heading>Your subscription is canceled</Heading>
      <Paragraph>Your Atlas HR {planName} subscription is canceled.</Paragraph>
      <Paragraph>
        {immediate ? "Your account is now on the free plan." : `You will keep access until ${periodEnd}.`}
      </Paragraph>
      <Paragraph>Your data is safe. Saved articles and generated documents are still in your account.</Paragraph>
      <Button href={billingUrl}>Reactivate anytime</Button>
      <Paragraph>If you have a moment, tell us why: {feedbackUrl}</Paragraph>
    </Layout>
  );
}

export default SubscriptionCanceled;
