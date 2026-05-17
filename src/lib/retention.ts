export const RETENTION_PERIODS = {
  profile: null,
  user_devices: 90,
  generated_documents_free: 30,
  generated_documents_paid: null,
  emails_sent: 365,
  stripe_webhook_events: 90,
  community_threads: null,
  community_replies: null,
  notifications_read: 60,
  usage_tracking: 365,
} as const;
