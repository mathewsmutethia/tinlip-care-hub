DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;

CREATE POLICY "Users can view own quotes"
  ON public.quotes FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
  );