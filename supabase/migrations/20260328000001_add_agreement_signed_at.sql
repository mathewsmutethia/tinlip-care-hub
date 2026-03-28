-- Add agreement signature timestamp to clients table
-- Captured server-side when client submits onboarding for approval

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS agreement_signed_at timestamptz;
