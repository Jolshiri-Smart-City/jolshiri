// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isVercelBuild = process.env.VERCEL === "1" || process.env.VERCEL === "true";
const publicSupabaseUrl = "https://slcwgpcywywxgeufvcnc.supabase.co";
const publicSupabasePublishableKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsY3dncGN5d3l3eGdldWZ2Y25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTU3MDEsImV4cCI6MjA5ODI5MTcwMX0.UevabLvEFgn_HLXn6Lvmlk75ltCkaEkWk_U9RTZO1WE";

process.env.SUPABASE_URL ||= publicSupabaseUrl;
process.env.SUPABASE_PUBLISHABLE_KEY ||= publicSupabasePublishableKey;
process.env.VITE_SUPABASE_URL ||= publicSupabaseUrl;
process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||= publicSupabasePublishableKey;
process.env.VITE_SUPABASE_PROJECT_ID ||= "slcwgpcywywxgeufvcnc";

export default defineConfig({
  ...(isVercelBuild ? { nitro: { preset: "vercel" } } : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
