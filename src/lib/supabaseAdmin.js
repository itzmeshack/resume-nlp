// src/lib/supabaseAdmin.js  (use ONLY in server code like /app/api/**)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY; // NEVER expose to client

if (!supabaseUrl || !serviceKey) {
  console.warn('[supabaseAdmin] Missing envs');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
