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
  return base;
}

function buildRangeParams(qs, dateFrom, dateTo){
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
    if (SRK && !userId) return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });

    // ----- 1) analyze_runs trend
    const qRuns = new URLSearchParams();
    qRuns.set('select','created_at,score_after,project_id,user_id');
    qRuns.set('limit','10000');
    if (userId)    qRuns.append('user_id', `eq.${userId}`);
    if (projectId) qRuns.append('project_id', `eq.${projectId}`);
    buildRangeParams(qRuns, dateFrom, dateTo);

    let res = await fetch(`${SB_URL}/rest/v1/analyze_runs?${qRuns.toString()}`, { method: 'GET', headers });
    if (res.status !== 404 && !res.ok){
      const body = await res.text().catch(()=> '');
      if (IS_DEV) return new Response(JSON.stringify({ error: body || res.statusText }), { status: 500 });
      return new Response(JSON.stringify({ error: 'Failed to compute trend' }), { status: 500 });
    }

    let rows = res.status === 404 ? [] : await res.json();
    if (!Array.isArray(rows) || rows.length === 0){
      // ----- 2) fallback to projects
      const qProj = new URLSearchParams();
      qProj.set('select', 'created_at,score_after,id,user_id');
      qProj.set('limit', '5000');
      if (userId)    qProj.append('user_id', `eq.${userId}`);
      if (projectId) qProj.append('id',      `eq.${projectId}`);
      buildRangeParams(qProj, dateFrom, dateTo);

      const res2 = await fetch(`${SB_URL}/rest/v1/projects?${qProj.toString()}`, { method: 'GET', headers });
      if (!res2.ok){
        const body = await res2.text().catch(()=> '');
        if (IS_DEV) return new Response(JSON.stringify({ error: body || res2.statusText }), { status: 500 });
        return new Response(JSON.stringify({ error: 'Failed to compute trend' }), { status: 500 });
      }
      rows = await res2.json();
    }

    // group by YYYY-MM-DD
    const map = new Map();
    for (const r of rows){
      const d = new Date(r.created_at);
      if (isNaN(d)) continue;
      const key = d.toISOString().slice(0,10);
      const e = map.get(key) || { sum: 0, n: 0 };
      e.sum += r?.score_after || 0;
      e.n   += 1;
      map.set(key, e);
    }

    const out = [...map.entries()]
      .sort((a,b)=> a[0].localeCompare(b[0]))
      .map(([date, { sum, n }]) => ({ date, avg_after: Math.round(sum / Math.max(n,1)), count: n }));

    return new Response(JSON.stringify(out), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e){
    if (IS_DEV) return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
    return new Response(JSON.stringify({ error: 'Failed to compute trend' }), { status: 500 });
  }
}
