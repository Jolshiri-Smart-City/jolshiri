
-- Lead CRM upgrades
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS follow_up_at timestamptz;
CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON public.leads(assigned_to);

-- Lead notes
CREATE TABLE IF NOT EXISTS public.lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_notes TO authenticated;
GRANT ALL ON public.lead_notes TO service_role;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_notes admin/agent read" ON public.lead_notes FOR SELECT TO authenticated USING (public.is_agent_or_admin());
CREATE POLICY "lead_notes admin/agent write" ON public.lead_notes FOR INSERT TO authenticated WITH CHECK (public.is_agent_or_admin());
CREATE POLICY "lead_notes admin/agent update" ON public.lead_notes FOR UPDATE TO authenticated USING (public.is_agent_or_admin());
CREATE POLICY "lead_notes admin delete" ON public.lead_notes FOR DELETE TO authenticated USING (public.is_admin());
CREATE INDEX IF NOT EXISTS lead_notes_lead_id_idx ON public.lead_notes(lead_id);

-- Storage: allow admin write to property-photos, floor-plans, branding (read public via bucket setting)
CREATE POLICY "Admin upload property-photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('property-photos','floor-plans','branding') AND public.is_admin());
CREATE POLICY "Admin update property-photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('property-photos','floor-plans','branding') AND public.is_admin());
CREATE POLICY "Admin delete property-photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('property-photos','floor-plans','branding') AND public.is_admin());
CREATE POLICY "Public read property-photos" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('property-photos','floor-plans','branding'));
