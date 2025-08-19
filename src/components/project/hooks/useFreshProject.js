'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

/**
 * Robust project fetcher:
 * - Pulls id from prop OR from the current route (/projects/[id])
 * - Explicitly selects required columns
 * - Exposes refresh + lastError
 */
export function useFreshProject(initialProject) {
  const params = useParams();
  const routeId =
    (params && (params.id || params.projectId)) ? (params.id || params.projectId) : null;

  const [proj, setProj] = useState(initialProject || null);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState(null);

  // Resolve id from the freshest source available
  const id = initialProject?.id ?? proj?.id ?? routeId ?? null;

  // If parent hands a different project, sync immediately
  useEffect(() => {
    if (initialProject?.id && initialProject.id !== proj?.id) {
      setProj(initialProject);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProject?.id]);

  const refresh = useCallback(async () => {
    if (!id) return null; // No id yet (e.g., navigating), caller should handle
    try {
      setLoading(true);
      setLastError(null);
      const { data, error } = await supabase
        .from('projects')
        .select(
          'id, user_id, name, resume_path, resume_url, resume_text, jd_text, latest_score, analysis, status, updated_at'
        )
        .eq('id', id)
        .single();

      if (error) {
        console.error('useFreshProject refresh error:', error);
        setLastError(error);
        return null;
      }
      setProj(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Initial fetch when id becomes available
    if (id) refresh();
  }, [id, refresh]);

  return { proj, setProj, refresh, loading, lastError };
}
