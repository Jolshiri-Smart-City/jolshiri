ALTER VIEW public.developers_public SET (security_invoker = off);
GRANT SELECT ON public.developers_public TO anon, authenticated;