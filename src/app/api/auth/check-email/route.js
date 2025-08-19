
{/** NOTE: this file is not in use in this entire project you can choose 
    to delete it in the future but be careful am not sure test the project without the 
    file and then delete it.  */}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'node';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // NEVER expose to client

export async function POST(req) {
  try {
    // Validate env quickly
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error('[check-email] Missing env', {
        hasUrl: !!SUPABASE_URL,
        hasServiceRole: !!SERVICE_ROLE_KEY,
      });
      return NextResponse.json(
        { error: 'Server misconfigured: missing Supabase env.' },
        { status: 500 }
      );
    }

    // Parse request body safely
    let body = null;
    try {
      body = await req.json();
    } catch (e) {
      console.error('[check-email] Invalid JSON body:', e?.message);
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const email = (body?.email || '').trim();
    if (!email) {
      return NextResponse.json({ error: 'Email required.' }, { status: 400 });
    }

    // Create admin client (server-side only)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Call Admin API
    const { data, error } = await admin.auth.admin.getUserByEmail(email);

    if (error && !/no user/i.test(error.message || '')) {
      console.error('[check-email] getUserByEmail error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json({
      exists: !!data?.user,
      email_confirmed_at: data?.user?.email_confirmed_at ?? null,
      user_id: data?.user?.id ?? null,
    });
  } catch (e) {
    console.error('[check-email] Unexpected error:', e);
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
}
