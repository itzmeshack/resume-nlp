'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import AppShell from '../../../components/app/AppShell';
import NewProjectWizard from '../../../components/project/NewProjectWizard';

export default function NewProjectPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data.session) {
        router.replace('/signin');
        return;
      }
      setChecking(false);
    })();
    return () => { mounted = false; };
  }, [router]);

  if (checking) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24">
          <div className="animate-pulse h-40 rounded-2xl bg-gray-200" />
        </div>
      </main>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">New Project</h1>
        <p className="text-gray-500">Upload your resume and paste a job description.</p>
      </div>
      <NewProjectWizard />
    </AppShell>
  );
}
