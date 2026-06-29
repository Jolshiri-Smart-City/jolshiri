
-- Scheduled publish + slugs for properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS publish_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS properties_slug_key ON public.properties(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS properties_publish_at_idx ON public.properties(publish_at);

-- Verified developer badge
ALTER TABLE public.developers ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;
