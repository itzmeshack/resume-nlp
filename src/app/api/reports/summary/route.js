import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    let q = supabase
      .from('projects')
      .select('id, latest_score, applied_suggestions_count, analysis, updated_at')
      .eq('user_id', userId);

    if (projectId) q = q.eq('id', projectId);
    if (dateFrom) q = q.gte('updated_at', `${dateFrom}T00:00:00.000Z`);
    if (dateTo) q = q.lte('updated_at', `${dateTo}T23:59:59.999Z`);

    const { data: projects, error } = await q;
    if (error) throw error;

    const total = projects?.length || 0;

    const scores = (projects || [])
      .map(p => Number(p.latest_score))
      .filter(n => Number.isFinite(n));

    const avgAfter =
      scores.length === 0 ? 0 : Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    // ✅ IMPORTANT: always define avgDelta, even if you can’t compute it yet
    const avgDelta = 0;

    const suggestionsTotal = (projects || []).reduce(
      (sum, p) => sum + (Number(p.applied_suggestions_count) || 0),
      0
    );

    // ATS metrics (safe defaults if missing)
    const atsPassRate =
      total === 0
        ? 0
        : Math.round(
            ((projects || []).filter(p => (p.analysis?.ats || []).every(c => c.status !== 'fail')).length / total) * 100
          );

    const atsCleanRate =
      total === 0
        ? 0
        : Math.round(
            ((projects || []).filter(p => (p.analysis?.ats || []).every(c => c.status === 'pass')).length / total) * 100
          );

    return NextResponse.json({
      total,
      avgAfter,
      avgDelta,
      atsPassRate,
      atsCleanRate,
      suggestionsTotal,
    });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Summary failed' }, { status: 500 });
  }
}
