import { existsSync } from "node:fs";
import { config } from "dotenv";
import { beforeAll } from "vitest";

const hasTestEnv = existsSync(".env.test.local");

config({ path: ".env.test.local" });
config({ path: ".env.local" });
config({ path: ".env" });

beforeAll(() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");

  if (url.includes("prod") || url.includes("atlashr.com")) {
    throw new Error("REFUSING to run stress tests against a production-looking Supabase URL");
  }

  if (!hasTestEnv) {
    console.warn(
      "Race test warning: .env.test.local was not found; tests are falling back to .env.local/.env."
    );
  }
});
