import { Button } from "../_components/Button";
import { Heading } from "../_components/Heading";
import { Layout } from "../_components/Layout";
import { Paragraph } from "../_components/Paragraph";

export function SupportTicketConfirmation({
  name,
  ticketId,
  subject,
  category,
}: {
  name: string | null;
  ticketId: string;
  subject: string;
  category: string;
}) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const ref = ticketId.slice(0, 8).toUpperCase();

  return (
    <Layout preview={`Support request received — ref #${ref}`}>
      <Heading>We received your message</Heading>
      <Paragraph>{greeting}</Paragraph>
      <Paragraph>
        We&apos;ve received your support request and will get back to you as soon as possible.
        Our typical response time is within one business day.
      </Paragraph>
      <Paragraph>
        <strong>Reference:</strong> #{ref}
        <br />
        <strong>Subject:</strong> {subject}
        <br />
        <strong>Category:</strong> {category}
      </Paragraph>
      <Paragraph>
        While you wait, you may find an answer in our Help Center or Knowledge Hub.
      </Paragraph>
      <Button href="https://atlashr.xyz/help">Visit Help Center</Button>
    </Layout>
  );
}

export default SupportTicketConfirmation;
