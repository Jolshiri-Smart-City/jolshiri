import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getPublicSupabase } from "@/lib/supabase-server";

// TODO: replace with your project URL once a custom domain is set.
const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const supabase = getPublicSupabase();
        const { data } = await supabase
          .from("properties")
          .select("id, updated_at")
          .neq("status", "sold")
          .limit(2000);

        const staticEntries = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/properties", changefreq: "hourly", priority: "0.9" },
          { path: "/compare", changefreq: "monthly", priority: "0.3" },
        ];

        const dynamic = (data ?? []).map((p: { id: string; updated_at: string }) => ({
          path: `/properties/${p.id}`,
          lastmod: p.updated_at,
          changefreq: "weekly",
          priority: "0.8",
        }));

        const urls = [...staticEntries, ...dynamic].map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            "lastmod" in e && e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            `    <changefreq>${e.changefreq}</changefreq>`,
            `    <priority>${e.priority}</priority>`,
            `  </url>`,
          ].filter(Boolean).join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
