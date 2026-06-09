/**
 * Atlas AI — intent classification.
 *
 * Before Atlas responds, every request is classified so the route can:
 *  - inject the right behaviour-mode guidance,
 *  - know whether sensitive data or approval is involved (for audit + gating),
 *  - record the detected mode/risk for analytics.
 *
 * This is a deterministic, dependency-free heuristic (fast and testable). It is
 * intentionally conservative: when a request looks restricted it is flagged as
 * such so the model's safety/approval behaviour kicks in. It never grants
 * access — actual data access is always enforced by RLS and the permission
 * helpers in `@/lib/auth/permissions`.
 */
import type { AtlasMode } from "@/lib/ai/prompts/atlas-system-prompt";
import type { Permission } from "@/lib/auth/permissions-shared";

export type RiskLevel = "low" | "medium" | "high" | "restricted";

export interface IntentClassification {
  mode: AtlasMode;
  riskLevel: RiskLevel;
  /** Highest action level (1–5) the request appears to reach. */
  actionLevel: 1 | 2 | 3 | 4 | 5;
  needsApproval: boolean;
  sensitiveDataInvolved: boolean;
  /** True when the answer should be grounded in an internal source if available. */
  sourceNeeded: boolean;
  canAnswerDirectly: boolean;
  /** Permissions that gate the data/action implied by the request. */
  requiredPermissions: Permission[];
  /** The keywords that drove the classification — useful for audit/debugging. */
  matchedSignals: string[];
}

function hasAny(text: string, words: string[]): string[] {
  return words.filter((w) => text.includes(w));
}

const RESTRICTED = [
  "terminate",
  "termination",
  "dismiss",
  "fire ",
  "sack",
  "salary change",
  "change salary",
  "raise salary",
  "payroll approval",
  "approve payroll",
  "delete employee",
  "delete record",
  "remove employee",
  "disciplinary notice",
  "legal notice",
  "bulk",
  "everyone's salary",
  "all salaries",
];

const SALARY = ["salary", "salaries", "compensation", "pay slip", "payslip", "payroll", "bonus", "wage"];
const MEDICAL = ["medical", "health condition", "pregnan", "sick note", "disability", "diagnosis"];
const DISCIPLINARY = ["disciplinary", "misconduct", "grievance", "warning letter", "investigation", "complaint"];

const DRAFT = ["draft", "write", "generate", "create a letter", "compose", "letter", "email", "announcement", "memo"];
const POLICY = ["policy", "policies", "handbook", "procedure"];
// Action phrases only — bare "onboarding"/"checklist" appear in definitional
// questions ("what is onboarding?") and must NOT trigger the workflow agent.
const WORKFLOW = [
  "start onboarding",
  "begin onboarding",
  "set up onboarding",
  "onboard ",
  "offboard",
  "onboarding checklist",
  "offboarding checklist",
  "create a checklist",
  "create checklist",
  "assign task",
  "assign tasks",
  "create task",
  "create tasks",
  "approval flow",
];
const ANALYTICS = ["summary", "report", "trend", "analytics", "headcount", "turnover", "absenteeism", "how many", "dashboard"];
const COMPLIANCE = ["terminate", "termination", "dismiss", "redundancy", "labour law", "labor law", "compliance", "statutory", "lawful", "legal"];
const DEVELOPER = ["api", "typescript", "next.js", "rls", "database schema", "endpoint", "code", "function", "deploy"];
const DOC_EDIT = ["exact words", "don't touch", "do not touch", "keep the layout", "same layout", "only change", "maintain font"];
const MANAGER = ["my team", "my reports", "direct report", "my direct"];
const SELF = ["my leave", "my payslip", "my document", "my profile", "my onboarding", "how many leave days do i"];

/** Classify a single natural-language request. `text` is matched case-insensitively. */
export function classifyRequest(rawText: string): IntentClassification {
  const text = (rawText ?? "").toLowerCase();
  const signals: string[] = [];

  const restricted = hasAny(text, RESTRICTED);
  const salary = hasAny(text, SALARY);
  const medical = hasAny(text, MEDICAL);
  const disciplinary = hasAny(text, DISCIPLINARY);
  const docEdit = hasAny(text, DOC_EDIT);
  const workflow = hasAny(text, WORKFLOW);
  const policy = hasAny(text, POLICY);
  const analytics = hasAny(text, ANALYTICS);
  const compliance = hasAny(text, COMPLIANCE);
  const developer = hasAny(text, DEVELOPER);
  const draft = hasAny(text, DRAFT);
  const manager = hasAny(text, MANAGER);
  const self = hasAny(text, SELF);

  signals.push(
    ...restricted,
    ...salary,
    ...medical,
    ...disciplinary,
    ...docEdit,
    ...workflow,
    ...policy,
    ...analytics,
    ...compliance,
    ...developer
  );

  const sensitiveDataInvolved = salary.length > 0 || medical.length > 0 || disciplinary.length > 0;

  // Risk level — restricted wins, then sensitive data / compliance, then drafting.
  let riskLevel: RiskLevel = "low";
  let actionLevel: IntentClassification["actionLevel"] = 1;
  let needsApproval = false;

  if (restricted.length > 0) {
    riskLevel = "restricted";
    actionLevel = 5;
    needsApproval = true;
  } else if (disciplinary.length > 0 || compliance.length > 0) {
    riskLevel = "high";
    actionLevel = 2;
    needsApproval = false; // drafting is fine; sending/executing still requires approval downstream
  } else if (sensitiveDataInvolved) {
    riskLevel = "medium";
  } else if (draft.length > 0 || workflow.length > 0) {
    riskLevel = "medium";
    actionLevel = workflow.length > 0 ? 3 : 2;
  }

  // Mode detection — most specific first. Personal ("my leave") and team
  // ("my team") phrasing is checked before analytics/workflow so a question
  // like "how many leave days do I have?" routes to self-service, not analytics.
  let mode: AtlasMode = "general";
  if (developer.length > 0) mode = "developer";
  else if (docEdit.length > 0) mode = "document_editor";
  else if (restricted.length > 0 || compliance.length > 0) mode = "compliance";
  else if (self.length > 0) mode = "employee_self_service";
  else if (manager.length > 0) mode = "manager_copilot";
  else if (workflow.length > 0) mode = "workflow_agent";
  else if (disciplinary.length > 0) mode = "hr_admin";
  else if (policy.length > 0) mode = "policy";
  else if (analytics.length > 0) mode = "analytics";
  else if (draft.length > 0) mode = "hr_admin";

  // Required permissions implied by the request (gates checked server-side).
  const requiredPermissions: Permission[] = [];
  if (salary.length > 0) requiredPermissions.push("view_compensation");
  if (disciplinary.length > 0) requiredPermissions.push("manage_employees");
  if (workflow.length > 0) requiredPermissions.push("manage_employees");
  if (analytics.length > 0) requiredPermissions.push("view_reports");
  if (restricted.length > 0) requiredPermissions.push("manage_admins");
  if (mode === "manager_copilot") requiredPermissions.push("view_team");

  const sourceNeeded = policy.length > 0 || mode === "policy" || mode === "compliance";
  const canAnswerDirectly = riskLevel === "low" && !sensitiveDataInvolved && actionLevel === 1;

  return {
    mode,
    riskLevel,
    actionLevel,
    needsApproval,
    sensitiveDataInvolved,
    sourceNeeded,
    canAnswerDirectly,
    requiredPermissions: Array.from(new Set(requiredPermissions)),
    matchedSignals: Array.from(new Set(signals)),
  };
}
