import { Button, Heading, Text } from "@react-email/components";
import { Layout } from "@/emails/_components/Layout";

export function DemoRequestConfirmation({
  name,
  company,
  bookingUrl,
}: {
  name: string;
  company?: string | null;
  bookingUrl: string;
}) {
  return (
    <Layout preview="We received your Atlas HR demo request">
      <Heading>Demo request received</Heading>
      <Text>Hi {name || "there"},</Text>
      <Text>
        Thanks for requesting a personalised Atlas HR demo{company ? ` for ${company}` : ""}. We will review your details and
        follow up with a relevant walkthrough.
      </Text>
      <Text>You can also choose a time directly here:</Text>
      <Button href={bookingUrl}>Book a demo time</Button>
      <Text>
        The demo usually covers your current HR tools, operating pain points, compliance needs, and the Atlas HR workspace flow.
      </Text>
    </Layout>
  );
}

export default DemoRequestConfirmation;
