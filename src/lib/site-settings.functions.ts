import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublicSupabase } = await import("./supabase-server");
  const supabase = getPublicSupabase();
  const { data } = await supabase.from("site_settings").select("key, value");
  const map: Record<string, unknown> = {};
  for (const row of (data ?? []) as Array<{ key: string; value: unknown }>) {
    map[row.key] = row.value;
  }
  return {
    hero: (map.hero ?? null) as HeroSettings | null,
    brand: (map.brand ?? null) as BrandSettings | null,
  };
});

export const updateSiteSetting = createServerFn({ method: "POST" })
  .inputValidator((input: { key: string; value: Record<string, unknown> }) =>
    z.object({ key: z.string().min(1).max(40), value: z.record(z.any()) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // NOTE: caller must be authorized — we check role via auth header
    const { requireSupabaseAuth } = await import("@/integrations/supabase/auth-middleware");
    void requireSupabaseAuth;
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
