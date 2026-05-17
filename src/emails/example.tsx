import { Button } from "./_components/Button";
import { Heading } from "./_components/Heading";
import { Layout } from "./_components/Layout";
import { Paragraph } from "./_components/Paragraph";

export default function ExampleEmail() {
  return (
    <Layout preview="Atlas HR email preview">
      <Heading>Atlas HR email preview</Heading>
      <Paragraph>
        This template verifies that the shared React Email components render correctly.
      </Paragraph>
      <Button href="https://atlashr.com/dashboard">Open Atlas HR</Button>
    </Layout>
  );
}
