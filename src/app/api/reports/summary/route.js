export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const SRK    = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const IS_DEV = process.env.NODE_ENV !== 'production';

function ymd(s){ if(!s) return null; const m=String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/); return m?`${m[1]}-${m[2]}-${m[3]}`:null; }
function headersFor(req){
  if (!SB_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (SRK) return { apikey: SRK, Authorization: `Bearer ${SRK}`, 'Content-Type': 'application/json', Prefer: 'count=none' };
  if (!ANON) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const base = { apikey: ANON, 'Content-Type': 'application/json', Prefer: 'count=none' };
  const auth = req.headers.get('authorization');
  if (auth) return { ...base, Authorization: auth };
  const m = (req.headers.get('cookie') || '').match(/sb-access-token=([^;]+)/);
  if (m) return { ...base, Authorization: `Bearer ${decodeURIComponent(m[1])}` };
  return base; // RLS will require valid JWT if no SRK
}

function buildRangeParams(qs, dateFrom, dateTo){
  // PostgREST accepts multiple filters (AND) by repeating the same key
  if (dateFrom) qs.append('created_at', `gte.${dateFrom}T00:00:00Z`);
  if (dateTo)   qs.append('created_at', `lte.${dateTo}T23:59:59.999Z`);
}

export async function GET(req){
  try{
    const { searchParams } = new URL(req.url);
    const userId    = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const dateFrom  = ymd(searchParams.get('dateFrom'));
    const dateTo    = ymd(searchParams.get('dateTo'));

    const headers = headersFor(req);
    if (SRK && !userId) {
      return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });
    }

    // -------- 1) Try analyze_runs first (per-run ground truth) --------
    const qRuns = new URLSearchParams();
    qRuns.set('select', 'score_before,score_after,ats_fail_count,suggestions_count,created_at,project_id,user_id');
    qRuns.set('limit', '10000');
    if (userId)    qRuns.append('user_id', `eq.${userId}`);
    if (projectId) qRuns.append('project_id', `eq.${projectId}`);
    buildRangeParams(qRuns, dateFrom, dateTo);

    let res = await fetch(`${SB_URL}/rest/v1/analyze_runs?${qRuns.toString()}`, { method: 'GET', headers });
    if (res.status === 404) {
      // table missing → treat as no runs
    } else if (!res.ok) {
      const body = await res.text().catch(()=> '');
      if (IS_DEV) return new Response(JSON.stringify({ error: body || res.statusText }), { status: 500 });
      return new Response(JSON.stringify({ error: 'Failed to compute summary' }), { status: 500 });
    }

    let runs = res.status === 404 ? [] : await res.json();

    // If we have runs, compute all KPIs from them
    if (Array.isArray(runs) && runs.length){
      let sumAfter=0, sumBefore=0, pass=0, sugg=0;
      for (const r of runs){
        sumAfter  += r?.score_after   || 0;
        sumBefore += r?.score_before  || 0;
        if ((r?.ats_fail_count || 0) === 0) pass += 1;
        sugg += r?.suggestions_count  || 0;
      }
      const total = runs.length;
      return new Response(JSON.stringify({
        total,
        avgAfter: Math.round(sumAfter / total),
        avgDelta: Math.round((sumAfter - sumBefore) / total),
        atsPassRate: Math.round((pass / total) * 100),
        suggestionsTotal: sugg,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // -------- 2) Fallback to projects if no runs exist in range --------
    const qProj = new URLSearchParams();
    qProj.set('select', 'id,score_before,score_after,ats_fail_count,suggestions_applied,created_at,user_id');
    qProj.set('limit', '5000');
    if (userId)    qProj.append('user_id', `eq.${userId}`);
    if (projectId) qProj.append('id',      `eq.${projectId}`);
    buildRangeParams(qProj, dateFrom, dateTo);

    const res2 = await fetch(`${SB_URL}/rest/v1/projects?${qProj.toString()}`, { method: 'GET', headers });
    if (!res2.ok){
      const body = await res2.text().catch(()=> '');
      if (IS_DEV) return new Response(JSON.stringify({ error: body || res2.statusText }), { status: 500 });
      return new Response(JSON.stringify({ error: 'Failed to compute summary' }), { status: 500 });
    }

    const rows = await res2.json();
    const total = rows.length;
    if (!total){
      return new Response(JSON.stringify({
        total: 0, avgAfter: 0, avgDelta: 0, atsPassRate: 0, suggestionsTotal: 0
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    let sumAfter=0, sumBefore=0, pass=0, sugg=0;
    for (const r of rows){
      sumAfter  += r?.score_after || 0;
      sumBefore += r?.score_before || 0;
      if ((r?.ats_fail_count || 0) === 0) pass += 1;
      sugg += r?.suggestions_applied || 0;
    }

    return new Response(JSON.stringify({
      total,
      avgAfter: Math.round(sumAfter / total),
      avgDelta: Math.round((sumAfter - sumBefore) / total),
      atsPassRate: Math.round((pass / total) * 100),
      suggestionsTotal: sugg,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (e){
    if (IS_DEV) return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
    return new Response(JSON.stringify({ error: 'Failed to compute summary' }), { status: 500 });
  }
}
