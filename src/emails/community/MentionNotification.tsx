import { Column, Link, Row, Section, Text } from "@react-email/components";
import { Button } from "../_components/Button";
import { Layout } from "../_components/Layout";

function initial(name: string) {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "?";
  return trimmed[0]?.toUpperCase() ?? "?";
}

export function MentionNotification({
  mentionerName,
  threadTitle,
  preview,
  mentionUrl,
  unsubscribeUrl,
}: {
  mentionerName: string;
  threadTitle: string;
  preview: string;
  mentionUrl: string;
  unsubscribeUrl?: string;
}) {
  const snippet = preview.slice(0, 200);

  return (
    <Layout
      preview={`${mentionerName} mentioned you in "${threadTitle}".`}
      unsubscribeUrl={unsubscribeUrl}
      unsubscribeLabel="community mention emails"
    >
      <Section
        style={{
          backgroundColor: "#EAF2FF",
          borderRadius: 12,
          margin: "0 0 20px",
          padding: "16px 20px",
        }}
      >
        <Row>
          <Column style={{ verticalAlign: "middle", width: "48px" }}>
            <Section
              style={{
                backgroundColor: "#0058BE",
                borderRadius: 10,
                height: 40,
                textAlign: "center",
                width: 40,
              }}
            >
              <Text
                aria-hidden="true"
                style={{
                  color: "#FFFFFF",
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: "40px",
                  margin: 0,
                }}
              >
                @
              </Text>
            </Section>
          </Column>
          <Column style={{ paddingLeft: 12, verticalAlign: "middle" }}>
            <Text
              style={{
                color: "#0058BE",
                fontSize: 16,
                fontWeight: 700,
                lineHeight: "22px",
                margin: 0,
              }}
            >
              Mention notification
            </Text>
            <Text
              style={{
                color: "#475569",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                lineHeight: "16px",
                margin: "2px 0 0",
                textTransform: "uppercase",
              }}
            >
              Workspace activity
            </Text>
          </Column>
        </Row>
      </Section>

      <Row style={{ marginBottom: 20 }}>
        <Column style={{ verticalAlign: "top", width: "60px" }}>
          <Section
            style={{
              backgroundColor: "#DBEAFE",
              borderRadius: 999,
              height: 48,
              textAlign: "center",
              width: 48,
            }}
          >
            <Text
              aria-hidden="true"
              style={{
                color: "#0058BE",
                fontSize: 20,
                fontWeight: 700,
                lineHeight: "48px",
                margin: 0,
              }}
            >
              {initial(mentionerName)}
            </Text>
          </Section>
        </Column>
        <Column style={{ paddingLeft: 12, verticalAlign: "top" }}>
          <Text
            style={{
              color: "#0F172A",
              fontSize: 16,
              lineHeight: "24px",
              margin: 0,
            }}
          >
            <strong>{mentionerName}</strong> mentioned you in the{" "}
            <Link href={mentionUrl} style={{ color: "#0058BE", fontWeight: 700 }}>
              {threadTitle}
            </Link>{" "}
            thread.
          </Text>
        </Column>
      </Row>

      <Section
        style={{
          backgroundColor: "#F2F3FD",
          borderLeft: "4px solid #0058BE",
          borderRadius: "0 12px 12px 0",
          margin: "0 0 24px",
          padding: "16px 20px",
        }}
      >
        <Text
          aria-hidden="true"
          style={{
            color: "#0058BE",
            fontSize: 32,
            fontWeight: 700,
            lineHeight: "20px",
            margin: "0 0 4px",
            opacity: 0.25,
          }}
        >
          &ldquo;
        </Text>
        <Text
          style={{
            color: "#0F172A",
            fontSize: 15,
            fontStyle: "italic",
            lineHeight: "24px",
            margin: 0,
          }}
        >
          {snippet}
          {preview.length > 200 ? "…" : ""}
        </Text>
      </Section>

      <Section style={{ margin: "0 0 8px" }}>
        <Row>
          <Column style={{ paddingRight: unsubscribeUrl ? 8 : 0, verticalAlign: "middle" }}>
            <Button href={mentionUrl}>View &amp; reply →</Button>
          </Column>
          {unsubscribeUrl && (
            <Column style={{ paddingLeft: 8, verticalAlign: "middle" }}>
              <Button href={unsubscribeUrl} variant="secondary">
                Mute thread
              </Button>
            </Column>
          )}
        </Row>
      </Section>
    </Layout>
  );
}

export default MentionNotification;
