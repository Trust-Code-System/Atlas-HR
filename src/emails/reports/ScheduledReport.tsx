import { Button, Heading, Text } from "@react-email/components";
import { Layout } from "@/emails/_components/Layout";

export function ScheduledReport({
  workspaceName,
  reportTitle,
  cadence,
  dashboardUrl,
  unsubscribeUrl,
}: {
  workspaceName: string;
  reportTitle: string;
  cadence: string;
  dashboardUrl: string;
  unsubscribeUrl?: string;
}) {
  return (
    <Layout
      preview={`${reportTitle} is attached for ${workspaceName}`}
      unsubscribeUrl={unsubscribeUrl}
      unsubscribeLabel="scheduled report emails"
    >
      <Heading>{reportTitle}</Heading>
      <Text>
        Your {cadence} Atlas HR report for {workspaceName} is attached.
      </Text>
      <Text>
        The attachment uses the filters saved on the scheduled report. Open Atlas HR to review the live dashboard and
        adjust the schedule.
      </Text>
      <Button href={dashboardUrl}>Open reports</Button>
    </Layout>
  );
}

export default ScheduledReport;
