import { Button } from "../_components/Button";
import { Card } from "../_components/Card";
import { Heading } from "../_components/Heading";
import { Layout } from "../_components/Layout";
import { Paragraph } from "../_components/Paragraph";

export function ReplyNotification({
  replierName,
  threadTitle,
  replyPreview,
  replyUrl,
  preferencesUrl,
  unsubscribeUrl,
}: {
  replierName: string;
  threadTitle: string;
  replyPreview: string;
  replyUrl: string;
  preferencesUrl: string;
  unsubscribeUrl?: string;
}) {
  return (
    <Layout preview={replyPreview.slice(0, 80)} unsubscribeUrl={unsubscribeUrl} unsubscribeLabel="community reply emails">
      <Heading>{replierName} replied to your thread</Heading>
      <Paragraph>
        {replierName} replied to &quot;{threadTitle}&quot;.
      </Paragraph>
      <Card>
        <Paragraph>{replyPreview.slice(0, 200)}</Paragraph>
      </Card>
      <Button href={replyUrl}>View reply</Button>
      <Paragraph>
        You are getting this because you posted this thread.{" "}
        <a href={preferencesUrl} style={{ color: "#2563EB" }}>Update preferences</a>
      </Paragraph>
    </Layout>
  );
}

export default ReplyNotification;
