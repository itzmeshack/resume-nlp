import { createClient } from '@supabase/supabase-js';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: projects, error } = await supabase
      .from('projects')
      .select('analysis')
      .eq('user_id', userId);

    if (error) throw error;

    const counts = new Map();

    for (const p of projects) {
      const checks = p.analysis?.ats || [];
      for (const c of checks) {
        if (c.status === 'pass') continue;
        counts.set(c.text, (counts.get(c.text) || 0) + 1);
      }
    }

    const result = Array.from(counts.entries()).map(([issue, count]) => ({
      issue,
      count,
    }));

    return Response.json(result);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
