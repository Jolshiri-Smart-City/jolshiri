import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HeroSettings {
  title_en: string;
  title_bn: string;
  subtitle_en: string;
  subtitle_bn: string;
  image_url: string;
  badge_en: string;
  badge_bn: string;
}
export interface BrandSettings {
  name_en: string;
  name_bn: string;
  logo_url: string;
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      const map: Record<string, unknown> = {};
      for (const r of (data ?? []) as Array<{ key: string; value: unknown }>) map[r.key] = r.value;
      return {
        hero: (map.hero ?? null) as HeroSettings | null,
        brand: (map.brand ?? null) as BrandSettings | null,
        faqs: (map.faqs ?? null) as { items?: Array<{ q: string; a: string }> } | Array<{ q: string; a: string }> | null,
        testimonials: (map.testimonials ?? null) as unknown,
      };
    },
  });
}
