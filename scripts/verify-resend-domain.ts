import { Resend } from "resend";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required");
  }

  const resend = new Resend(apiKey);
  const result = await resend.domains.list();

  if (result.error) {
    throw new Error(result.error.message);
  }

  const domains = result.data?.data ?? [];
  if (domains.length === 0) {
    console.log("No Resend domains found. Add and verify a sending domain in Resend.");
    process.exitCode = 1;
    return;
  }

  let allVerified = true;
  for (const domain of domains) {
    const verified = domain.status === "verified";
    allVerified &&= verified;
    console.log(`${verified ? "GREEN" : "RED"} ${domain.name}: ${domain.status}`);
  }

  if (!allVerified) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
