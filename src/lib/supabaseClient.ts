import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl) {
  console.error("[Supabase] VITE_SUPABASE_URL is missing. Check your environment variables.");
}
if (!supabaseAnonKey) {
  console.error("[Supabase] VITE_SUPABASE_ANON_KEY is missing. Check your environment variables.");
}

console.log("[Supabase] Initializing client:", supabaseUrl ? "URL ✓" : "URL MISSING", supabaseAnonKey ? "KEY ✓" : "KEY MISSING");

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "syedom-labs-auth",
  },
});

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;
