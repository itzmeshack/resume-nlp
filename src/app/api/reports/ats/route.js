export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SB_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const SRK     = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const IS_DEV  = process.env.NODE_ENV !== 'production';

function ymd(s){ if(!s) return null; const m=String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/); return m?`${m[1]}-${m[2]}-${m[3]}`:null; }
function authHeaders(req){
  if(!SB_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (SRK) return { apikey: SRK, Authorization: `Bearer ${SRK}` };
  if (!ANON) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const h = { apikey: ANON };
  const auth = req.headers.get('authorization');
  if (auth) return { ...h, Authorization: auth };
  const m = (req.headers.get('cookie') || '').match(/sb-access-token=([^;]+)/);
  if (m) return { ...h, Authorization: `Bearer ${decodeURIComponent(m[1])}` };
  return h;
}

export async function GET(req){
  try{
    const { searchParams } = new URL(req.url);
    const userId    = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const dFrom     = ymd(searchParams.get('dateFrom'));
    const dTo       = ymd(searchParams.get('dateTo'));
    const limit     = Number(searchParams.get('limit') || 10);

    const headers = { ...authHeaders(req), 'Content-Type': 'application/json', 'Prefer': 'count=none' };
    if (SRK && !userId) return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });

    const qs = new URLSearchParams();
    qs.set('select','ats_issues,created_at,project_id,user_id');
    qs.set('limit','10000');
    if (userId)    qs.append('user_id',     `eq.${userId}`);
    if (projectId) qs.append('project_id',  `eq.${projectId}`);
    if (dFrom || dTo){
      const parts = [];
      if (dFrom) parts.push(`created_at.gte.${dFrom}T00:00:00Z`);
      if (dTo)   parts.push(`created_at.lte.${dTo}T23:59:59.999Z`);
      qs.append('and', `(${parts.join(',')})`);
    }

    const url = `${SB_URL}/rest/v1/analyze_runs?${qs.toString()}`;
    const res = await fetch(url, { method:'GET', headers });

    // If table doesn’t exist, return empty (no 500)
    if (res.status === 404) {
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type':'application/json' } });
    }
    if (!res.ok){
      const body = await res.text().catch(()=> '');
      if (IS_DEV) return new Response(JSON.stringify({ error: body || res.statusText }), { status: 500 });
      return new Response(JSON.stringify({ error: 'Failed to compute ATS issues' }), { status: 500 });
    }

    const rows = await res.json(); // []
    const tally = new Map();
    for (const r of rows){
      const arr = Array.isArray(r?.ats_issues) ? r.ats_issues : [];
      for (const s of arr){
        const k = String(s || '').trim();
        if (!k) continue;
        tally.set(k, (tally.get(k) || 0) + 1);
      }
    }

    const out = [...tally.entries()]
      .sort((a,b)=> b[1]-a[1])
      .slice(0, limit)
      .map(([issue, count]) => ({ issue, count }));

    return new Response(JSON.stringify(out), { status: 200, headers: { 'Content-Type':'application/json' } });
  } catch(e){
    if (IS_DEV) return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
    return new Response(JSON.stringify({ error: 'Failed to compute ATS issues' }), { status: 500 });
  }
}
