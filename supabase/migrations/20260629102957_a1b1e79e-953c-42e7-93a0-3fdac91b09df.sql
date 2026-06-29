
-- Site settings (singleton key-value for editable site content)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings public read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings admin write" ON public.site_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Seed default content
INSERT INTO public.site_settings (key, value) VALUES
  ('hero', '{"title_en":"Find your home in Purbachal''s largest planned smart city.","title_bn":"পূর্বাচলের বৃহত্তম পরিকল্পিত স্মার্ট সিটিতে আপনার বাড়ি খুঁজুন।","subtitle_en":"Compare verified flats across developers, sectors and budgets — in under a minute.","subtitle_bn":"বিভিন্ন ডেভেলপার, সেক্টর ও বাজেটের যাচাইকৃত ফ্ল্যাট মিনিটে তুলনা করুন।","image_url":"https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=2000&q=80","badge_en":"Purbachal · 48,000+ flats coming online","badge_bn":"পূর্বাচল · ৪৮,০০০+ ফ্ল্যাট"}'::jsonb),
  ('brand', '{"name_en":"Jolshiri Smart City","name_bn":"জলশিরি স্মার্ট সিটি","logo_url":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Allow admins to manage projects, amenities, developers
DROP POLICY IF EXISTS "amenities admin write" ON public.amenities;
CREATE POLICY "amenities admin write" ON public.amenities FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "projects admin write" ON public.projects;
CREATE POLICY "projects admin write" ON public.projects FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "developers admin write" ON public.developers;
CREATE POLICY "developers admin write" ON public.developers FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Allow admin to view/update profile roles
DROP POLICY IF EXISTS "profiles admin all" ON public.profiles;
CREATE POLICY "profiles admin all" ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin() OR id = auth.uid()) WITH CHECK (public.is_admin() OR id = auth.uid());
