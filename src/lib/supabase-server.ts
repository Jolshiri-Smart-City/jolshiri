// Server-side Supabase client using the publishable key. RLS is respected as anon.
// Safe to import only from .server.ts files or inside server function handlers.
import { createClient } from "@supabase/supabase-js";

const PUBLIC_SUPABASE_URL = "https://slcwgpcywywxgeufvcnc.supabase.co";
const PUBLIC_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsY3dncGN5d3l3eGdldWZ2Y25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTU3MDEsImV4cCI6MjA5ODI5MTcwMX0.UevabLvEFgn_HLXn6Lvmlk75ltCkaEkWk_U9RTZO1WE";

export function getPublicSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return createClient(supabaseUrl, publishableKey, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}
