-- ============================================
-- Harden admin UPDATE policies + rejection_reason length constraints
-- ============================================

-- Prevent admins from changing immutable columns on clients.
-- id is the auth UID anchor — changing it would corrupt all FK relationships.
-- email is managed by Supabase Auth — changes here would desync auth.users.
DROP POLICY IF EXISTS "admins_update_all_clients" ON clients;
CREATE POLICY "admins_update_all_clients" ON clients
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (
    public.is_admin()
    AND NEW.id = OLD.id
    AND NEW.email = OLD.email
  );

-- Prevent admins from changing the vehicle primary key.
DROP POLICY IF EXISTS "admins_update_all_vehicles" ON vehicles;
CREATE POLICY "admins_update_all_vehicles" ON vehicles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (
    public.is_admin()
    AND NEW.id = OLD.id
  );

-- Enforce server-side length limit on rejection_reason.
-- The admin UI caps at 500 chars but the DB had no constraint.
ALTER TABLE clients
  ADD CONSTRAINT clients_rejection_reason_length
  CHECK (char_length(rejection_reason) <= 500);

ALTER TABLE vehicles
  ADD CONSTRAINT vehicles_rejection_reason_length
  CHECK (char_length(rejection_reason) <= 500);
