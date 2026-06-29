import { useQuery } from "@tanstack/react-query";
import { useHydrated } from "@tanstack/react-router";
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
  whatsapp?: string;
  phone?: string;
  email?: string;
  address_en?: string;
  address_bn?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  twitter?: string;
}
export interface WhyItem {
  title_en: string;
  title_bn: string;
  body_en: string;
  body_bn: string;
}
export interface WhySettings {
  heading_en?: string;
  heading_bn?: string;
  items?: WhyItem[];
}
export interface TestimonialItem {
  name: string;
  role?: string;
  text: string;
  rating?: number;
}
export interface SeoSettings {
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  keywords?: string;
  fb_pixel_id?: string;
  ga_id?: string;
  gtm_id?: string;
  head_html?: string;
  body_html?: string;
}

export interface AboutCard { title: string; body: string }
export interface AboutSettings {
  heading?: string;
  intro?: string;
  cards?: AboutCard[];
  cta_title?: string;
  cta_body?: string;
}
export interface ContactSettings {
  heading?: string;
  subtitle?: string;
  note?: string;
  map_embed_url?: string;
}
export interface FooterSettings {
  copyright?: string;
}

export function useSiteSettings() {
  const hydrated = useHydrated();

  return useQuery({
    queryKey: ["site_settings"],
    enabled: hydrated,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      const map: Record<string, unknown> = {};
      for (const r of (data ?? []) as Array<{ key: string; value: unknown }>) map[r.key] = r.value;
      return {
        hero: (map.hero ?? null) as HeroSettings | null,
        brand: (map.brand ?? null) as BrandSettings | null,
        why: (map.why ?? null) as WhySettings | null,
        faqs: (map.faqs ?? null) as { items?: Array<{ q: string; a: string }> } | Array<{ q: string; a: string }> | null,
        testimonials: (map.testimonials ?? null) as TestimonialItem[] | { items?: TestimonialItem[] } | null,
        seo: (map.seo ?? null) as SeoSettings | null,
        about: (map.about ?? null) as AboutSettings | null,
        contact: (map.contact ?? null) as ContactSettings | null,
        footer: (map.footer ?? null) as FooterSettings | null,
      };
    },
  });
}
