'use client';

import { useState } from 'react';
import { Plus, Trash2, RefreshCcw, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTargets } from '../hooks/useTargets';
import { supabase } from '../../../lib/supabaseClient';
import ScoreRing from '../../../components/ScoreRing';

export default function MultiTargetAnalyzePanel({ projectId, resumeText }) {
  const { targets, upsert, remove, refresh, loading } = useTargets(projectId);
  const [busy, setBusy] = useState(false);

  const analyzeAll = async () => {
    try {
      if (!resumeText?.trim()) { toast.error('Add/Extract resume text first.'); return; }
      const jobs = targets.map(t => ({ id:t.id, title:t.title, industry:t.industry, jdText:t.jd_text }))
                          .filter(j => (j.jdText||'').trim().length>0);
      if (!jobs.length) { toast.error('No non-empty JDs to analyze.'); return; }
      setBusy(true);
      const res = await fetch('/api/ai-analyze-batch', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ resumeText, jobs }) });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Batch analyze failed');

      const updates = payload.results.filter(r=>r.clientId && !r.error).map(async r => {
        const { error } = await supabase.from('project_targets')
          .update({ latest_score: r.score, analysis: r })
          .eq('id', r.clientId);
        if (error) throw error;
      });
      await Promise.all(updates);
      await refresh();
      toast.success('Analyzed all roles');
    } catch (e) { console.error(e); toast.error(e.message || 'Analyze failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 text-gray-900">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Analyze Multiple Jobs</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => upsert({ title:'New Role', industry:'', jd_text:'' })}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
            <Plus className="w-4 h-4" /> Add Role
          </button>
          <button onClick={analyzeAll} disabled={busy || loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />} {busy ? 'Analyzing…' : 'Analyze All'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {targets.map(t => (
          <div key={t.id} className="rounded-xl border border-gray-200 bg-white">
            <div className="h-1 rounded-t-xl bg-gradient-to-r from-blue-600 to-indigo-500" />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <input defaultValue={t.title || ''} onBlur={e => upsert({ ...t, title:e.target.value })}
                  placeholder="Role title" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600" />
                <input defaultValue={t.industry || ''} onBlur={e => upsert({ ...t, industry:e.target.value })}
                  placeholder="Industry" className="w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600" />
                <button onClick={async () => { if(confirm('Remove this role?')) await remove(t.id); }}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>

              <textarea defaultValue={t.jd_text || ''} onBlur={e => upsert({ ...t, jd_text:e.target.value })}
                placeholder="Paste job description here…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[140px] focus:ring-2 focus:ring-blue-600" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-xs px-2 py-1 rounded-full border border-gray-300 bg-white">
                    {(t.jd_text || '').length} chars
                  </div>
                  {typeof t.latest_score === 'number' && (
                    <div className="flex items-center gap-2">
                      <ScoreRing value={t.latest_score} size={72} />
                      <div className="text-sm text-gray-700">Match</div>
                    </div>
                  )}
                </div>
                <button
                  onClick={async ()=>{
                    try{
                      if (!resumeText?.trim()) { toast.error('Add/Extract resume text first.'); return; }
                      if (!(t.jd_text||'').trim()) { toast.error('Paste the JD for this role.'); return; }
                      const res = await fetch('/api/ai-analyze-batch', { method:'POST', headers:{'Content-Type':'application/json'},
                        body: JSON.stringify({ resumeText, jobs:[{ id:t.id, title:t.title, industry:t.industry, jdText:t.jd_text }] }) });
                      const payload = await res.json();
                      if (!res.ok) throw new Error(payload?.error || 'Analyze failed');
                      const r = payload.results?.[0];
                      if (r?.error) throw new Error(r.error);
                      const { error } = await supabase.from('project_targets').update({ latest_score: r.score, analysis: r }).eq('id', t.id);
                      if (error) throw error;
                      await refresh(); toast.success('Analyzed');
                    }catch(e){ console.error(e); toast.error(e.message || 'Analyze failed'); }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
                  <RefreshCcw className="w-4 h-4" /> Analyze
                </button>
              </div>

              {t.analysis?.suggestions?.length ? (
                <div className="mt-2 space-y-2">
                  {t.analysis.suggestions.map((s, i)=>(
                    <div key={i} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">{s}</div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
