import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Defensive check: log missing env vars in browser console
if (!supabaseUrl || supabaseUrl === "undefined") {
  console.error("[Supabase] ❌ VITE_SUPABASE_URL is missing or undefined. Add it to your environment variables.");
}
if (!supabaseAnonKey || supabaseAnonKey === "undefined") {
  console.error("[Supabase] ❌ VITE_SUPABASE_ANON_KEY is missing or undefined. Add it to your environment variables.");
}

if (supabaseUrl && supabaseAnonKey) {
  console.log("[Supabase] ✓ Client initializing —", supabaseUrl.replace("https://", "").split(".")[0]);
}

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

/**
 * Wraps a Supabase query result and logs detailed errors.
 * Returns the data or null if there was an error, preventing crashes.
 */
export function handleSupabaseResult<T>(
  result: { data: T | null; error: any },
  context: string
): T | null {
  if (result.error) {
    const code = result.error?.code || result.error?.status || "unknown";
    const msg = result.error?.message || "Unknown error";
    if (code === "PGRST301" || msg.includes("JWT") || msg.includes("401")) {
      console.warn(`[Supabase] 🔑 Auth/JWT error in ${context}: ${msg}`);
    } else if (code === "42501" || msg.includes("policy") || msg.includes("permission")) {
      console.warn(`[Supabase] 🚫 RLS policy blocked ${context}: ${msg}. Run the admin RLS migration in Supabase dashboard.`);
    } else {
      console.error(`[Supabase] ❌ Error in ${context}: [${code}] ${msg}`);
    }
    return null;
  }
  return result.data;
}
