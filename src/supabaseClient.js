import { createClient } from "@supabase/supabase-js";

// ==============================================================================
// SUPABASE CONFIGURATION
// Replace SUPABASE_URL and SUPABASE_PUBLIC_KEY below with your Supabase credentials
// ==============================================================================

const rawUrl = "https://dsagwpwvqfynfabntdwa.supabase.co/rest/v1/";
// Clean URL so createClient works smoothly regardless of trailing /rest/v1/
const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const SUPABASE_PUBLIC_KEY = "sb_publishable_4aCu8KXAbNety0qZWk8MTw_kUyKvZBH";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

