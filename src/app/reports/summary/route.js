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
      .select('latest_score, analysis')
      .eq('user_id', userId);

    if (error) throw error;

    const total = projects.length;

    const avgAfter =
      total === 0
        ? 0
        : Math.round(
            projects.reduce((sum, p) => sum + (p.latest_score || 0), 0) / total
          );

  const suggestionsTotal = projects.reduce(
  (sum, p) => sum + (p.applied_suggestions_count || 0),
  0
);

   const atsPassRate =
  total === 0
    ? 0
    : Math.round(
        (projects.filter(p =>
          (p.analysis?.ats || []).every(c => c.status !== 'fail')
        ).length / total) * 100
      );

const atsCleanRate =
  total === 0
    ? 0
    : Math.round(
        (projects.filter(p =>
          (p.analysis?.ats || []).every(c => c.status === 'pass')
        ).length / total) * 100
      );


 return Response.json({
  total,
  avgAfter,
  avgDelta,
  atsPassRate,
  atsCleanRate,
  suggestionsTotal,
});

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
