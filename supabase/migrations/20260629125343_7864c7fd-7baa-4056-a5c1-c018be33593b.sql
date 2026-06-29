
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_lead_status_change() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Anyone can create a lead" ON public.leads;
CREATE POLICY "Anyone can create a lead"
  ON public.leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    full_name IS NOT NULL
    AND length(btrim(full_name)) > 0
    AND (
      (phone IS NOT NULL AND length(btrim(phone)) > 0)
      OR (email IS NOT NULL AND length(btrim(email)) > 0)
    )
  );
