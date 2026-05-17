import fs from "fs";
import path from "path";
import type { ComplianceUpdate } from "./compliance-shared";
export type { ComplianceUpdate } from "./compliance-shared";

const DATA_FILE = path.join(process.cwd(), "src", "data", "compliance-updates.json");

export function getAllComplianceUpdates(): ComplianceUpdate[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed.updates ?? [];
  } catch {
    return [];
  }
}

export function getPublishedComplianceUpdates(): ComplianceUpdate[] {
  return getAllComplianceUpdates().filter((u) => u.adminStatus === "published");
}

export function saveAllComplianceUpdates(updates: ComplianceUpdate[]): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify({ lastUpdated: new Date().toISOString(), updates }, null, 2),
    "utf-8"
  );
}
