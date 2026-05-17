import { Button } from "../_components/Button";
import { Card } from "../_components/Card";
import { Heading } from "../_components/Heading";
import { Layout } from "../_components/Layout";
import { Paragraph } from "../_components/Paragraph";

export function NewSignIn({
  device,
  location,
  time,
  securityUrl,
}: {
  device: string;
  location: string;
  time: string;
  securityUrl: string;
}) {
  return (
    <Layout preview="We noticed a new sign-in to your Atlas HR account.">
      <Heading>New sign-in to your account</Heading>
      <Paragraph>We noticed a sign-in to your Atlas HR account from a new device.</Paragraph>
      <Card>
        <Paragraph>Device: {device}</Paragraph>
        <Paragraph>Location: {location}</Paragraph>
        <Paragraph>Time: {time}</Paragraph>
      </Card>
      <Paragraph>Was this you?</Paragraph>
      <Button href={securityUrl}>Yes, that was me</Button>
      <span style={{ display: "inline-block", width: 12 }} />
      <Button href={securityUrl} variant="secondary">No, secure my account</Button>
    </Layout>
  );
}

export default NewSignIn;
