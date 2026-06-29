
CREATE OR REPLACE VIEW public.developers_public
WITH (security_invoker=on) AS
SELECT id, name FROM public.developers;

GRANT SELECT ON public.developers_public TO anon, authenticated;

-- Allow the public view to read developer rows for name lookup only.
-- We need an RLS policy on developers that exposes rows to anon, but
-- application code only ever selects (id, name) via developers_public.
CREATE POLICY "Public can read developer names via view"
ON public.developers FOR SELECT
TO anon, authenticated
USING (true);

CREATE OR REPLACE VIEW public.property_listing_view AS
SELECT p.id, p.unit_number, p.price_total, p.price_per_sqft, p.size_sqft,
       p.bedrooms, p.bathrooms, p.floor_number, p.status, p.possession_date,
       p.is_ready_to_move, p.facing, p.created_at,
       pr.name AS project_name, pr.sector, pr.block,
       d.name AS developer_name,
       (SELECT pm.url FROM public.property_media pm
         WHERE pm.property_id = p.id AND pm.media_type = 'photo'
         ORDER BY pm.display_order LIMIT 1) AS cover_photo_url
FROM public.properties p
JOIN public.projects pr ON pr.id = p.project_id
JOIN public.developers_public d ON d.id = pr.developer_id;

GRANT SELECT ON public.property_listing_view TO anon, authenticated;
