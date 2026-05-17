import { Heading, Text } from "@react-email/components";
import { Layout } from "@/emails/_components/Layout";

export function DemoRequestAlert({
  leadId,
  fullName,
  email,
  company,
  role,
  companySize,
  currentTools,
  biggestChallenge,
  preferredMeetingTime,
  intentScore,
}: {
  leadId: string;
  fullName?: string | null;
  email: string;
  company?: string | null;
  role?: string | null;
  companySize?: string | null;
  currentTools?: string[] | null;
  biggestChallenge?: string | null;
  preferredMeetingTime?: string | null;
  intentScore: number;
}) {
  return (
    <Layout preview="New Atlas HR demo request">
      <Heading>New demo request</Heading>
      <Text>
        {fullName || email} from {company || "unknown company"} requested a demo.
      </Text>
      <Text>Lead ID: {leadId}</Text>
      <Text>Email: {email}</Text>
      <Text>Role: {role || "Not provided"}</Text>
      <Text>Company size: {companySize || "Not provided"}</Text>
      <Text>Current tools: {currentTools?.length ? currentTools.join(", ") : "Not provided"}</Text>
      <Text>Preferred meeting time: {preferredMeetingTime || "Not provided"}</Text>
      <Text>Intent score: {intentScore}</Text>
      <Text>Biggest challenge: {biggestChallenge || "Not provided"}</Text>
    </Layout>
  );
}

export default DemoRequestAlert;
