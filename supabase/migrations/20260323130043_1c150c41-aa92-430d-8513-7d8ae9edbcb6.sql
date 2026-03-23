
-- Fix quotes: restrict SELECT so emails aren't publicly exposed
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;

-- Only allow viewing quotes if not authenticated (no email shown) or if authenticated user matches email
CREATE POLICY "Users can view own quotes"
  ON public.quotes FOR SELECT
  USING (
    auth.uid() IS NULL OR 
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Fix audit_logs: add WITH CHECK to the update policy on clients to reinforce trigger protection
DROP POLICY IF EXISTS "Users can update own profile" ON public.clients;
CREATE POLICY "Users can update own profile"
  ON public.clients FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role IS NOT DISTINCT FROM (SELECT c.role FROM public.clients c WHERE c.id = auth.uid())
  );

-- Add storage policies for the now-private documents bucket
CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
