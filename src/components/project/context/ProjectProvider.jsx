'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

// Local cache key
const k = (id) => `resumeai_project_${id}`;

const ProjectCtx = createContext(null);

export default function ProjectProvider({ projectId, initialProject = null, children }) {
  const [mode, setMode] = useState('supabase'); // 'supabase' | 'local'
  const [project, setProject] = useState(initialProject);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState(null);

  const loadFromSupabase = useCallback(async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    if (error) throw error;
    return data;
  }, [projectId]);

  const load = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    setLastError(null);
    try {
      const data = await loadFromSupabase();
      setProject(data);
      localStorage.setItem(k(projectId), JSON.stringify(data)); // cache
      setMode('supabase');
    } catch (e) {
      console.warn('[ProjectProvider] Supabase read failed, using local mode.', e?.message || e);
      setLastError(e);
      // fallback to local cache
      const raw = localStorage.getItem(k(projectId));
      if (raw) {
        setProject(JSON.parse(raw));
      } else {
        // minimal local seed
        setProject({ id: projectId, name: 'Local Project', resume_text: '', jd_text: '', analysis: null });
      }
      setMode('local');
    } finally {
      setLoading(false);
    }
  }, [projectId, loadFromSupabase]);

  useEffect(() => { load(); }, [load]);

  // helpers to upsert locally and (if possible) in supabase
  const persist = useCallback(async (patch) => {
    if (!projectId) return;
    const next = { ...(project || {}), ...patch, id: projectId, updated_at: new Date().toISOString() };
    setProject(next);
    localStorage.setItem(k(projectId), JSON.stringify(next));
    if (mode === 'supabase') {
      const { data, error } = await supabase
        .from('projects')
        .update(patch)
        .eq('id', projectId)
        .select('*')
        .single();
      if (error) {
        toast.error(error.message);
        // fallback to local if write blocked
        setMode('local');
        return next;
      }
      // ensure context has the canonical row
      setProject(data);
      localStorage.setItem(k(projectId), JSON.stringify(data));
      return data;
    }
    return next;
  }, [mode, project, projectId]);

  const saveResumeText = useCallback(async (text) => {
    const trimmed = (text || '').trim();
    const p = await persist({ resume_text: trimmed });
    toast.success('Resume text saved');
    return p;
  }, [persist]);

  const saveJDText = useCallback(async (text) => {
    const trimmed = (text || '').trim();
    const p = await persist({ jd_text: trimmed });
    toast.success('Job description saved');
    return p;
  }, [persist]);

  const runAI = useCallback(async () => {
    const resumeText = (project?.resume_text || '').trim();
    const jdText = (project?.jd_text || '').trim();
    if (!resumeText || !jdText) {
      toast.error('Please provide resume text and JD text before analyzing.');
      return null;
    }

    const res = await fetch('/api/ai-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, jdText })
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.error || 'Analyze failed');
      return null;
    }

    const next = await persist({
      latest_score: data.score,
      status: 'Analyzed',
      analysis: data,
    });
    toast.success('AI analysis complete');
    return next;
  }, [persist, project?.resume_text, project?.jd_text]);

  const value = useMemo(() => ({
    project, setProject,
    loading, lastError, mode,
    refresh: load,
    saveResumeText, saveJDText,
    runAI,
  }), [project, loading, lastError, mode, load, saveResumeText, saveJDText, runAI]);

  return (
    <ProjectCtx.Provider value={value}>
      {children}
    </ProjectCtx.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectCtx);
  if (!ctx) throw new Error('useProject must be used inside <ProjectProvider>');
  return ctx;
}
