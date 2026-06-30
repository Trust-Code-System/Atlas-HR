import { describe, it, expect } from "vitest";
import { classifyRequest } from "@/lib/ai/intent";
import { routeModel, DEFAULT_MODEL, STRONG_MODEL } from "@/lib/ai/model-router";

/** Helper: classify text then route, with sensible defaults. */
function route(
  text: string,
  opts: Partial<{
    userRequestedThinking: boolean;
    hasAttachments: boolean;
    isEmployeePortal: boolean;
    messageLength: number;
  }> = {},
) {
  const intent = classifyRequest(text);
  return routeModel({
    intent,
    userRequestedThinking: opts.userRequestedThinking ?? false,
    messageLength: opts.messageLength ?? text.length,
    hasAttachments: opts.hasAttachments ?? false,
    isEmployeePortal: opts.isEmployeePortal ?? false,
  });
}

describe("routeModel — smart model routing", () => {
  it("keeps everyday data lookups on the fast default model, no thinking", () => {
    const d = route("how many people are in engineering?");
    expect(d.model).toBe(DEFAULT_MODEL);
    expect(d.thinking).toBe(false);
    expect(d.escalated).toBe(false);
    expect(d.maxTokens).toBe(4096);
  });

  it("never truncates: default output budget is well above the old 2048 cap", () => {
    const d = route("what's the weather of our headcount today");
    expect(d.maxTokens).toBeGreaterThanOrEqual(4096);
  });

  it("escalates compliance/termination requests to the strong model + thinking", () => {
    const d = route("what should we consider before we dismiss an employee on probation?");
    expect(d.model).toBe(STRONG_MODEL);
    expect(d.thinking).toBe(true);
    expect(d.escalated).toBe(true);
    expect(d.maxTokens).toBeGreaterThan(d.thinkingBudgetTokens);
  });

  it("gives document drafting the strong writer and a large output budget (no thinking)", () => {
    const d = route("draft a full remote work policy for our company");
    expect(d.model).toBe(STRONG_MODEL);
    expect(d.thinking).toBe(false);
    expect(d.maxTokens).toBe(8192);
  });

  it("escalates long requests even when low-risk", () => {
    const d = route("summarise this", { messageLength: 1200 });
    expect(d.escalated).toBe(true);
    expect(d.model).toBe(STRONG_MODEL);
  });

  it("escalates when the request carries attachments to reason over", () => {
    const d = route("review this CV", { hasAttachments: true, messageLength: 200 });
    expect(d.escalated).toBe(true);
    expect(d.model).toBe(STRONG_MODEL);
  });

  it("honours an explicit user 'deep thinking' toggle", () => {
    const d = route("what is onboarding?", { userRequestedThinking: true });
    expect(d.thinking).toBe(true);
    expect(d.model).toBe(STRONG_MODEL);
    expect(d.reason).toContain("user_requested_thinking");
  });

  it("keeps employee self-service fast, cheap, and un-escalated", () => {
    const d = route("how many leave days do I have?", { isEmployeePortal: true });
    expect(d.model).toBe(DEFAULT_MODEL);
    expect(d.thinking).toBe(false);
    expect(d.escalated).toBe(false);
    expect(d.maxTokens).toBe(3072);
    expect(d.reason).toBe("employee_self_service");
  });

  it("records a human-readable reason for the decision", () => {
    const d = route("draft a termination letter");
    expect(d.reason.length).toBeGreaterThan(0);
    expect(d.reason).not.toBe("default");
  });
});
