import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { CALCULATORS } from "@/lib/calculators";
import { CalculatorClient } from "./calculator-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return CALCULATORS.map((calculator) => ({ slug: calculator.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const calculator = CALCULATORS.find((item) => item.slug === slug);

  return {
    title: calculator ? `${calculator.name} | Atlas HR` : "Tool | Atlas HR",
  };
}

export default async function ToolPage({ params }: PageProps) {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const { slug } = await params;
  const calculator = CALCULATORS.find((item) => item.slug === slug);
  if (!calculator) notFound();

  return (
    <CalculatorClient
      calculator={{
        slug: calculator.slug,
        name: calculator.name,
        description: calculator.description,
        fields: calculator.fields,
        defaultInputs: calculator.defaultInputs as Record<string, unknown>,
      }}
    />
  );
}
