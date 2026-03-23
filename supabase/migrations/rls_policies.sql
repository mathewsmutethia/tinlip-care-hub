-- ============================================
-- TINLIP RLS POLICIES
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Clients: Users can read/update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON clients;
CREATE POLICY "Users can view own profile" ON clients
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON clients;
CREATE POLICY "Users can update own profile" ON clients
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON clients;
CREATE POLICY "Users can insert own profile" ON clients
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Vehicles: Users can manage own vehicles
DROP POLICY IF EXISTS "Users can CRUD own vehicles" ON vehicles;
CREATE POLICY "Users can CRUD own vehicles" ON vehicles
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE auth.uid() = id)
  );

-- Incidents: Users can manage own incidents
DROP POLICY IF EXISTS "Users can CRUD own incidents" ON incidents;
CREATE POLICY "Users can CRUD own incidents" ON incidents
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE auth.uid() = id)
  );

-- Quotes: Allow read for quote calculator (no auth required for viewing)
DROP POLICY IF EXISTS "Anyone can view quotes" ON quotes;
CREATE POLICY "Anyone can view quotes" ON quotes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create quotes" ON quotes;
CREATE POLICY "Anyone can create quotes" ON quotes
  FOR INSERT WITH CHECK (true);

-- Service role can do anything (for admin)
-- Note: This bypasses RLS - use only in secure server-side code

-- Insert test admin user (optional - for testing)
-- INSERT INTO auth.users (id, email, created_at) 
-- VALUES ('YOUR-ADMIN-USER-ID', 'admin@tinlip.com', NOW())
-- ON CONFLICT (id) DO NOTHING;
