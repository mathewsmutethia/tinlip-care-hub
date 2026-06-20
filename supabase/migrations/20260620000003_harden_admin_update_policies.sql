-- ============================================
-- Harden admin UPDATE policies + rejection_reason length constraints
-- ============================================

-- Restore admin UPDATE policies without invalid NEW/OLD RLS references.
-- Column immutability is enforced via trigger below instead.
DROP POLICY IF EXISTS "admins_update_all_clients" ON clients;
CREATE POLICY "admins_update_all_clients" ON clients
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admins_update_all_vehicles" ON vehicles;
CREATE POLICY "admins_update_all_vehicles" ON vehicles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Trigger: block changes to immutable columns on clients.
-- id is the auth UID anchor — changing it corrupts all FK relationships.
-- email is managed by Supabase Auth — direct changes here desync auth.users.
CREATE OR REPLACE FUNCTION prevent_clients_immutable_changes()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'clients.id is immutable';
  END IF;
  IF NEW.email <> OLD.email THEN
    RAISE EXCEPTION 'clients.email is immutable — use Supabase Auth to change email';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clients_immutable ON clients;
CREATE TRIGGER trg_clients_immutable
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION prevent_clients_immutable_changes();

-- Trigger: block changes to immutable columns on vehicles.
CREATE OR REPLACE FUNCTION prevent_vehicles_immutable_changes()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'vehicles.id is immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vehicles_immutable ON vehicles;
CREATE TRIGGER trg_vehicles_immutable
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION prevent_vehicles_immutable_changes();

-- Enforce server-side length limit on rejection_reason.
-- The admin UI caps at 500 chars but the DB had no constraint.
ALTER TABLE clients
  ADD CONSTRAINT clients_rejection_reason_length
  CHECK (char_length(rejection_reason) <= 500);

ALTER TABLE vehicles
  ADD CONSTRAINT vehicles_rejection_reason_length
  CHECK (char_length(rejection_reason) <= 500);
