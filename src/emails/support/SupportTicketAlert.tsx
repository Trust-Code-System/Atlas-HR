import { Button } from "../_components/Button";
import { Card } from "../_components/Card";
import { Heading } from "../_components/Heading";
import { Layout } from "../_components/Layout";
import { Paragraph } from "../_components/Paragraph";

export function SupportTicketAlert({
  ticketId,
  fromName,
  fromEmail,
  subject,
  category,
  priority,
  body,
}: {
  ticketId: string;
  fromName: string | null;
  fromEmail: string;
  subject: string;
  category: string;
  priority: string;
  body: string;
}) {
  const ref = ticketId.slice(0, 8).toUpperCase();

  return (
    <Layout preview={`[${priority.toUpperCase()}] New ticket #${ref}: ${subject}`}>
      <Heading>New support ticket #{ref}</Heading>
      <Paragraph>
        <strong>Priority:</strong> {priority}
        <br />
        <strong>Category:</strong> {category}
        <br />
        <strong>From:</strong> {fromName ?? "Unknown"} &lt;{fromEmail}&gt;
      </Paragraph>
      <Card>
        <Paragraph>
          <strong>{subject}</strong>
        </Paragraph>
        <Paragraph>{body}</Paragraph>
      </Card>
      <Button href={`https://atlashr.com/admin/tickets?id=${ticketId}`}>
        View ticket in admin
      </Button>
    </Layout>
  );
}

export default SupportTicketAlert;
