// Server-side Supabase client using the publishable key. RLS is respected as anon.
// Safe to import only from .server.ts files or inside server function handlers.
import { createClient } from "@supabase/supabase-js";

export function getPublicSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}
