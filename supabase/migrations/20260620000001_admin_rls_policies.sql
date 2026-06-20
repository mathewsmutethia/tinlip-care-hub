-- ============================================
-- ADMIN RLS POLICIES
-- Grants account_manager, finance, and ceo roles
-- full read/write access across all tables.
-- Role is stored in auth.jwt() -> app_metadata ->> 'role'
-- and is set manually in Supabase Auth > Users > app_metadata.
-- ============================================

-- Helper: evaluate JWT claim once per query, not once per row.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) IN ('account_manager', 'finance', 'ceo')
$$;

-- ============
-- clients
-- ============
DROP POLICY IF EXISTS "admins_select_all_clients" ON clients;
CREATE POLICY "admins_select_all_clients" ON clients
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admins_update_all_clients" ON clients;
CREATE POLICY "admins_update_all_clients" ON clients
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============
-- vehicles
-- ============
DROP POLICY IF EXISTS "admins_select_all_vehicles" ON vehicles;
CREATE POLICY "admins_select_all_vehicles" ON vehicles
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admins_update_all_vehicles" ON vehicles;
CREATE POLICY "admins_update_all_vehicles" ON vehicles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============
-- incidents
-- ============
DROP POLICY IF EXISTS "admins_select_all_incidents" ON incidents;
CREATE POLICY "admins_select_all_incidents" ON incidents
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admins_update_all_incidents" ON incidents;
CREATE POLICY "admins_update_all_incidents" ON incidents
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============
-- payments
-- ============
DROP POLICY IF EXISTS "admins_select_all_payments" ON payments;
CREATE POLICY "admins_select_all_payments" ON payments
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admins_insert_payments" ON payments;
CREATE POLICY "admins_insert_payments" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admins_update_payments" ON payments;
CREATE POLICY "admins_update_payments" ON payments
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============
-- coverage
-- ============
DROP POLICY IF EXISTS "admins_select_all_coverage" ON coverage;
CREATE POLICY "admins_select_all_coverage" ON coverage
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admins_insert_coverage" ON coverage;
CREATE POLICY "admins_insert_coverage" ON coverage
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admins_update_coverage" ON coverage;
CREATE POLICY "admins_update_coverage" ON coverage
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============
-- audit_logs
-- ============
DROP POLICY IF EXISTS "admins_select_all_audit_logs" ON audit_logs;
CREATE POLICY "admins_select_all_audit_logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admins_insert_audit_logs" ON audit_logs;
CREATE POLICY "admins_insert_audit_logs" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- ============
-- storage.objects (documents bucket)
-- Admins need to generate signed URLs for client ID docs,
-- vehicle logbooks, and insurance certificates.
-- The existing client policy restricts by folder = auth.uid(),
-- so we add a separate admin SELECT policy.
-- ============
DROP POLICY IF EXISTS "admins_select_all_documents" ON storage.objects;
CREATE POLICY "admins_select_all_documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.is_admin()
  );
