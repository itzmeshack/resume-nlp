'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import UploadDropzone from '../../common/UploadDropzone';
import { Toaster, toast } from 'react-hot-toast';
import { Save, Trash2, UploadCloud, Link as LinkIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPanel({ project, onProjectChange }) {
  const router = useRouter();
  const [name, setName] = useState(project.name || '');
  const [jd, setJd] = useState(project.jd_text || '');
  const [uploading, setUploading] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [file, setFile] = useState(null);

  const openResume = async () => {
    try {
      if (project.resume_path) {
        const { data, error } = await supabase
          .storage
          .from('resumes')
          .createSignedUrl(project.resume_path, 60);
        if (error) throw error;
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      } else if (project.resume_url) {
        window.open(project.resume_url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('No resume file available.');
      }
    } catch (e) {
      toast.error(e.message || 'Could not open resume.');
    }
  };

  const saveMeta = async () => {
    setSavingMeta(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ name, jd_text: jd })
        .eq('id', project.id)
        .select('*')
        .single();

      if (error) throw error;
      onProjectChange?.(data);
      toast.success('Project details saved');
    } catch (e) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSavingMeta(false);
    }
  };

  const uploadResume = async () => {
    if (!file) {
      toast.error('Choose a file first');
      return;
    }
    setUploading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) throw new Error('Not signed in');

      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const path = `${uid}/${Date.now()}.${ext}`;

      // Upload to bucket
      const { error: upErr } = await supabase
        .storage
        .from('resumes')
        .upload(path, file, { upsert: false, cacheControl: '3600' });

      if (upErr) throw upErr;

      // Public URL (may not be accessible if bucket is private)
      const { data: pub } = supabase.storage.from('resumes').getPublicUrl(path);
      const publicUrl = pub?.publicUrl ?? null;

      // Save both path + url
      const { data, error } = await supabase
        .from('projects')
        .update({ resume_path: path, resume_url: publicUrl })
        .eq('id', project.id)
        .select('*')
        .single();

      if (error) throw error;

      onProjectChange?.(data);
      toast.success('Resume uploaded');
      setFile(null);
    } catch (e) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteProject = async () => {
    const ok = window.confirm('Delete this project? This cannot be undone.');
    if (!ok) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', project.id);
      if (error) throw error;
      toast.success('Project deleted');
      router.replace('/projects');
    } catch (e) {
      toast.error(e.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-8">
      <Toaster position="top-center" />

      {/* Basics */}
      <div className="rounded-2xl border border-gray-300 bg-white p-5 shadow-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Basics</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-800">Project name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              placeholder="e.g., Frontend Engineer ↔ Job Title"
            />
          </div>
          <div>
            <label className="text-sm text-gray-800">Resume file</label>
            <div className="mt-1 flex items-center gap-3">
              <button
                onClick={openResume}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-500 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 focus:ring-2 focus:ring-blue-600"
              >
                <LinkIcon className="w-4 h-4" />
                View current
              </button>
              <span className="text-xs text-gray-800 truncate">
                {project.resume_path || (project.resume_url ? 'public URL saved' : 'no file')}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm text-gray-800">Job description</label>
          <textarea
            rows={8}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            placeholder="Paste or edit the job description…"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={saveMeta}
            disabled={savingMeta}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {savingMeta ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Re-upload */}
      <div className="rounded-2xl border border-indigo-300 bg-indigo-50 p-5 shadow-md">
        <h3 className="font-semibold text-indigo-900 mb-3">Re-upload Resume</h3>
        <UploadDropzone
          accept=".pdf,.doc,.docx,.txt"
          maxSizeMB={5}
          onFile={setFile}
          file={file}
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={uploadResume}
            disabled={!file || uploading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-600 disabled:opacity-60"
          >
            <UploadCloud className="w-4 h-4" />
            {uploading ? 'Uploading…' : 'Upload & Save'}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-400 bg-red-100 p-5 shadow-md">
        <h3 className="font-semibold text-red-900 mb-2">Danger Zone</h3>
        <p className="text-sm text-red-800">
          This permanently deletes the project and its analysis.
        </p>
        <button
          onClick={deleteProject}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-600"
        >
          <Trash2 className="w-4 h-4" />
          Delete project
        </button>
      </div>
    </div>
  );
}
