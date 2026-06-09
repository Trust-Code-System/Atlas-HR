import { describe, it, expect } from "vitest";
import { classifyRequest } from "@/lib/ai/intent";

describe("classifyRequest — mode detection", () => {
  it("maps a leave self-service question to employee self-service", () => {
    const r = classifyRequest("How many leave days do I have left?");
    expect(r.mode).toBe("employee_self_service");
    expect(r.canAnswerDirectly).toBe(true);
  });

  it("maps a warning-letter request to HR Admin and a high risk level", () => {
    const r = classifyRequest("Draft a warning letter for repeated lateness");
    // disciplinary signal ("warning letter") routes to hr_admin
    expect(r.mode).toBe("hr_admin");
    expect(r.riskLevel).toBe("high");
    expect(r.sensitiveDataInvolved).toBe(true);
  });

  it("maps a termination request to restricted Compliance mode requiring approval", () => {
    const r = classifyRequest("Terminate this employee now");
    expect(r.mode).toBe("compliance");
    expect(r.riskLevel).toBe("restricted");
    expect(r.needsApproval).toBe(true);
    expect(r.actionLevel).toBe(5);
    expect(r.requiredPermissions).toContain("manage_admins");
  });

  it("flags an unauthorised-style salary request as sensitive and gated", () => {
    const r = classifyRequest("Show me everyone's salary");
    expect(r.sensitiveDataInvolved).toBe(true);
    // "everyone's salary" is in the restricted list (bulk confidential export)
    expect(r.riskLevel).toBe("restricted");
    expect(r.requiredPermissions).toContain("view_compensation");
  });

  it("routes a policy request to Policy mode and marks a source as needed", () => {
    const r = classifyRequest("Create a remote work policy");
    expect(r.mode).toBe("policy");
    expect(r.sourceNeeded).toBe(true);
  });

  it("routes onboarding to the Workflow Agent at prepare-action level", () => {
    const r = classifyRequest("Start onboarding for the new hire and assign the checklist");
    expect(r.mode).toBe("workflow_agent");
    expect(r.actionLevel).toBe(3);
    expect(r.requiredPermissions).toContain("manage_employees");
  });

  it("respects exact-text document editing instructions", () => {
    const r = classifyRequest("Change only the date in this letter, don't touch anything else");
    expect(r.mode).toBe("document_editor");
  });

  it("treats a simple definition as a low-risk general question", () => {
    const r = classifyRequest("What is onboarding?");
    expect(r.mode).toBe("general");
    expect(r.riskLevel).toBe("low");
    expect(r.needsApproval).toBe(false);
    expect(r.canAnswerDirectly).toBe(true);
  });
});
