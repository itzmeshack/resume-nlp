'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export function useTargets(projectId) {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState(null);

  const refresh = useCallback(async () => {
    if (!projectId) return [];
    try {
      setLoading(true); setLastError(null);
      const { data, error } = await supabase
        .from('project_targets')
        .select('id, project_id, title, industry, jd_text, latest_score, analysis, updated_at')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setTargets(data || []);
      return data || [];
    } catch (e) { setLastError(e); return []; }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { refresh(); }, [refresh]);

  const upsert = useCallback(async (patch) => {
    if (!projectId) return null;
    if (patch.id) {
      const { data, error } = await supabase
        .from('project_targets').update({
          title: patch.title, industry: patch.industry, jd_text: patch.jd_text
        }).eq('id', patch.id).select('*').single();
      if (error) throw error;
      setTargets(t => t.map(x => x.id === data.id ? data : x));
      return data;
    }
    const { data, error } = await supabase
      .from('project_targets')
      .insert([{ project_id: projectId, title: patch.title || 'Untitled role', industry: patch.industry || null, jd_text: patch.jd_text || '' }])
      .select('*').single();
    if (error) throw error;
    setTargets(t => [data, ...t]);
    return data;
  }, [projectId]);

  const remove = useCallback(async (id) => {
    const { error } = await supabase.from('project_targets').delete().eq('id', id);
    if (error) throw error;
    setTargets(t => t.filter(x => x.id !== id));
  }, []);

  return { targets, setTargets, refresh, upsert, remove, loading, lastError };
}
