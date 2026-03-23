
-- Restrict clients from updating their own status/role columns
-- Only allow self-updates to: name, phone, company_name, address, id_number, id_document_url
-- Status can only go from 'profile_incomplete' to 'pending_approval' by the user themselves

CREATE OR REPLACE FUNCTION public.enforce_client_update_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the user is updating their own row (not an admin/service role)
  -- Check if they're trying to change protected fields
  IF auth.uid() = NEW.id THEN
    -- Prevent role changes by users
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'You cannot change your own role';
    END IF;
    
    -- Only allow status transition: profile_incomplete -> pending_approval
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NOT (OLD.status = 'profile_incomplete' AND NEW.status = 'pending_approval') THEN
        RAISE EXCEPTION 'Invalid status transition';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_client_update_rules_trigger
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_client_update_rules();
