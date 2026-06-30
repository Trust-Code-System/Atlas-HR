import { trackServer, trackInternal } from "./posthog-server";

// All server-side events and their required properties.
// Adding a new event? Add it here first, then to docs/tracking-plan.md.
type ServerEventMap = {
  // Tools (server events — have timing/output data)
  tool_generation_started: { tool_slug: string; inputs_filled_count: number };
  tool_generation_completed: {
    tool_slug: string;
    time_seconds: number;
    output_chars: number;
  };
  tool_generation_failed: { tool_slug: string; error_type: string };

  // Copilot (server events — have timing data)
  copilot_message_sent: {
    message_chars: number;
    conversation_id: string | null;
    thinking_enabled?: boolean;
    // Atlas AI intent classification (see @/lib/ai/intent)
    detected_mode?: string;
    risk_level?: string;
    needs_approval?: boolean;
    sensitive_data?: boolean;
    // Smart model routing (see @/lib/ai/model-router)
    routed_model?: string;
    routed_escalated?: boolean;
    routed_reason?: string;
  };
  copilot_message_received: {
    conversation_id: string | null;
    response_chars: number;
    total_time_ms: number;
    thinking_enabled?: boolean;
  };

  // Community (server actions)
  community_thread_created: {
    category: string;
    is_anonymous: boolean;
    body_chars: number;
  };
  community_reply_created: { thread_id: string; is_anonymous: boolean };
  community_answer_accepted: { thread_id: string };

  // Mini-HRIS
  org_created: { industry?: string; country?: string; size?: string };
  employee_added: { method: "manual" | "csv_import" };
  leave_request_created: { type: string };
  leave_request_approved: Record<string, never>;
  leave_request_rejected: Record<string, never>;
  org_member_invited: Record<string, never>;
  org_member_joined: Record<string, never>;
};

// Revenue events that fire regardless of analytics consent (GDPR Art. 6(1)(b/f))
type InternalEventMap = {
  subscription_started: { plan: string; interval: string; in_trial: boolean };
  trial_converted: { plan: string; interval: string };
  trial_expired: { plan: string };
  subscription_upgraded: { from_plan: string; to_plan: string };
  subscription_downgraded: { from_plan: string; to_plan: string };
  subscription_canceled: { plan: string; days_active: number };
  subscription_reactivated: { plan: string };
  payment_failed: { plan: string; attempt_number: number };
  checkout_completed: { plan: string; interval: string };
};

/** Tracks a user behavior event. Respects the user's analytics consent. */
export async function trackEvent<T extends keyof ServerEventMap>(
  userId: string,
  event: T,
  properties: ServerEventMap[T]
) {
  await trackServer(userId, event as string, properties as Record<string, unknown>);
}

/** Tracks a revenue/system event. Bypasses consent — use only for billing lifecycle events. */
export async function trackRevenueEvent<T extends keyof InternalEventMap>(
  userId: string,
  event: T,
  properties: InternalEventMap[T]
) {
  await trackInternal(userId, event as string, properties as Record<string, unknown>);
}
