'use client';

import { useState } from 'react';
import UploadDropzone from '../common/UploadDropzone';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function NewProjectWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [resumeFile, setResumeFile] = useState(null);
  const [jdText, setJdText] = useState('');
  const [saving, setSaving] = useState(false);

  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const handleCreate = async () => {
    try {
      setSaving(true);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) {
        toast.error('Not signed in.');
        return;
      }

      // 1) optional upload
      let uploadedPath = null;
      let publicUrl = null;
      if (resumeFile) {
        const ext = resumeFile.name.split('.').pop()?.toLowerCase() || 'bin';
        uploadedPath = `${uid}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase
          .storage
          .from('resumes')
          .upload(uploadedPath, resumeFile, { upsert: false, cacheControl: '3600' });
        if (upErr) {
          console.warn('Upload failed:', upErr.message);
          toast.error('Resume upload failed (continuing without file).');
          uploadedPath = null;
        } else {
          const { data: pub } = supabase.storage.from('resumes').getPublicUrl(uploadedPath);
          publicUrl = pub?.publicUrl ?? null;
        }
      }

      // 2) compute project name
      const nameFromFile = resumeFile?.name?.replace(/\.[^.]+$/, '') || 'My Resume';
      const snippet = jdText.trim().split('\n')[0]?.slice(0, 60) || 'Job Description';
      const projectName = `${nameFromFile} ↔ ${snippet}`;

      // 3) insert project
      const { data: inserted, error } = await supabase
        .from('projects')
        .insert({
          user_id: uid,
          name: projectName,
          resume_url: publicUrl,
          jd_text: jdText,
          status: 'Draft',
        })
        .select('id')
        .single();

      if (error) {
        toast.error(error.message || 'Failed to create project.');
        return;
      }

      toast.success('Project created!');
      router.push(`/projects/${inserted.id}`);
    } catch {
      toast.error('Failed to create project.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-5">
      <Toaster position="top-center" />
      {/* Stepper */}
      <div className="flex items-center justify-center gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${step >= i ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {i}
            </div>
            {i < 3 && <div className={`w-10 h-1 rounded ${step > i ? 'bg-blue-300' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Steps */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Upload your resume</h3>
          <p className="text-sm text-gray-600">PDF, DOCX, or TXT — up to 5 MB.</p>
          <UploadDropzone
            accept=".pdf,.doc,.docx,.txt"
            maxSizeMB={5}
            onFile={(file) => setResumeFile(file)}
            file={resumeFile}
          />
          <div className="flex justify-between mt-4">
            <span className="text-sm text-gray-500">{resumeFile ? resumeFile.name : 'No file selected'}</span>
            <button
              onClick={next}
              disabled={!resumeFile}
              className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Paste job description</h3>
          <textarea
            rows={10}
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste the job description here…"
            className="w-full rounded-xl border border-white/40 bg-white/80 backdrop-blur-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="rounded-xl border px-4 py-2 hover:bg-gray-50">Back</button>
            <button
              onClick={next}
              disabled={!jdText.trim()}
              className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Review & create</h3>
          <div className="rounded-xl border border-white/40 bg-white/80 backdrop-blur-xl p-4">
            <div className="text-sm">
              <div><span className="text-gray-500">Resume:</span> {resumeFile?.name || '-'}</div>
              <div className="mt-2"><span className="text-gray-500">JD preview:</span></div>
              <pre className="mt-2 text-xs text-gray-700 max-h-48 overflow-auto whitespace-pre-wrap">
                {jdText.slice(0, 1200) || '-'}
              </pre>
            </div>
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="rounded-xl border px-4 py-2 hover:bg-gray-50">Back</button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="rounded-xl bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
