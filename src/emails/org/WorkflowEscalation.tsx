import { Column, Link, Row, Section, Text } from "@react-email/components";
import { Button } from "../_components/Button";
import { Heading } from "../_components/Heading";
import { Layout } from "../_components/Layout";
import { Paragraph } from "../_components/Paragraph";

const approvalUrl = (appUrl: string, requestId: string) =>
  `${appUrl}/workspace/approvals/${requestId}`;

function readableTrigger(triggerType: string) {
  return triggerType.replace(/_/g, " ");
}

function DetailRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <Row
      style={{
        borderBottom: last ? "none" : "1px solid #E2E8F0",
        padding: last ? "0" : "0 0 12px",
        margin: last ? "0" : "0 0 12px",
      }}
    >
      <Column style={{ width: "42%" }}>
        <Text style={{ color: "#64748B", fontSize: 14, lineHeight: "20px", margin: 0 }}>
          {label}
        </Text>
      </Column>
      <Column style={{ width: "58%", textAlign: "right" }}>
        <Text
          className="email-text"
          style={{
            color: "#0F172A",
            fontSize: 15,
            fontWeight: 700,
            lineHeight: "22px",
            margin: 0,
            textTransform: label === "Request type" ? "capitalize" : "none",
          }}
        >
          {value}
        </Text>
      </Column>
    </Row>
  );
}

export function WorkflowEscalation({
  recipientName,
  triggerType,
  requestId,
  ageHours,
  appUrl,
  unsubscribeUrl,
}: {
  recipientName: string;
  triggerType: string;
  requestId: string;
  ageHours: string;
  appUrl: string;
  unsubscribeUrl?: string;
}) {
  const reviewUrl = approvalUrl(appUrl, requestId);
  const requestType = readableTrigger(triggerType);

  return (
    <Layout
      preview={`Action required: ${requestType} approval has been waiting ${ageHours} hours`}
      unsubscribeUrl={unsubscribeUrl}
      unsubscribeLabel="workflow escalation emails"
    >
      <Section style={{ margin: "0 0 24px" }}>
        <Text
          style={{
            color: "#2563EB",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            lineHeight: "16px",
            margin: "0 0 10px",
            textTransform: "uppercase",
          }}
        >
          Global Enterprise
        </Text>
        <Heading>Action Required: Approval Needed</Heading>
        <Paragraph>Hi {recipientName},</Paragraph>
        <Paragraph>
          You have a pending approval request that requires your review. It has been waiting for{" "}
          <strong>{ageHours} hours</strong> and has been escalated to you.
        </Paragraph>
      </Section>

      <Section
        style={{
          backgroundColor: "#F8FAFC",
          borderLeft: "4px solid #2563EB",
          borderRadius: "0 12px 12px 0",
          margin: "0 0 24px",
          padding: "20px",
        }}
      >
        <Text style={{ color: "#2563EB", fontSize: 22, lineHeight: "22px", margin: "0 0 16px" }}>
          &#9745;
        </Text>
        <DetailRow label="Escalated to" value={recipientName} />
        <DetailRow label="Request type" value={requestType} />
        <DetailRow label="Waiting time" value={`${ageHours} hours`} />
        <DetailRow label="Request ID" value={requestId.slice(0, 8).toUpperCase()} last />
      </Section>

      <Section style={{ margin: "0 0 20px" }}>
        <Row>
          <Column style={{ width: "50%", paddingRight: 6 }}>
            <Button href={reviewUrl}>View &amp; Approve</Button>
          </Column>
          <Column style={{ width: "50%", paddingLeft: 6 }}>
            <Link
              href={reviewUrl}
              style={{
                backgroundColor: "#FFFFFF",
                border: "2px solid #727785",
                borderRadius: 8,
                color: "#0F172A",
                display: "inline-block",
                fontSize: 14,
                fontWeight: 700,
                lineHeight: "20px",
                padding: "10px 18px",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              Review / Reject
            </Link>
          </Column>
        </Row>
      </Section>

      <Section
        style={{
          backgroundColor: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: "14px 16px",
        }}
      >
        <Text style={{ color: "#475569", fontSize: 12, lineHeight: "18px", margin: 0 }}>
          Approving this request in Atlas HR will update the workflow record and notify the requester. You received this because you are an HR admin in this workspace and the original approver did not respond within the SLA window.
        </Text>
      </Section>
    </Layout>
  );
}

export default WorkflowEscalation;
