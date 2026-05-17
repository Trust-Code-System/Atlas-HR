-- Add notification_preferences column to profiles (if not already present)
alter table public.profiles
  add column if not exists notification_preferences jsonb default '{
    "email": {
      "replies": true,
      "mentions": true,
      "weekly_digest": true,
      "product_updates": false
    },
    "in_app": {
      "replies": true,
      "mentions": true,
      "votes": true
    }
  }'::jsonb;
