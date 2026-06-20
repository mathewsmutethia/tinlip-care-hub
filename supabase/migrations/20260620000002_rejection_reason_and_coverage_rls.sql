-- ============================================
-- Add rejection_reason column + client coverage RLS
-- ============================================

-- rejection_reason is set by admins when rejecting a client or vehicle.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Clients need to read their own coverage to display coverage status
-- and check whether they are eligible to raise incidents.
-- RLS was enabled on coverage but no client-facing SELECT policy existed.
DROP POLICY IF EXISTS "clients_select_own_coverage" ON coverage;
CREATE POLICY "clients_select_own_coverage" ON coverage
  FOR SELECT USING (client_id = auth.uid());
