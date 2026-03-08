import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://tmsxfbrszqwsppmbkmmd.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtc3hmYnJzenF3c3BwbWJrbW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NTY3MDYsImV4cCI6MjA4ODQzMjcwNn0.xDq7IzmYPgqp6KRqL2iP17y0XmcW9lur3PRNsstYtkw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;
