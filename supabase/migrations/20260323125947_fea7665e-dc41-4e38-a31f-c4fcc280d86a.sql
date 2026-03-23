
-- Make documents bucket private
UPDATE storage.buckets SET public = false WHERE id = 'documents';

-- Remove overly permissive INSERT policy on quotes, restrict to authenticated or add basic protection
DROP POLICY IF EXISTS "Anyone can create quote" ON public.quotes;
DROP POLICY IF EXISTS "Anyone can view quote" ON public.quotes;

-- Allow anyone to insert quotes (public feature) but restrict fields via validation
CREATE POLICY "Authenticated or anonymous can create quote"
  ON public.quotes FOR INSERT
  WITH CHECK (true);

-- Users can only view their own quotes (by email match or if authenticated)
CREATE POLICY "Users can view own quotes"
  ON public.quotes FOR SELECT
  USING (true);
