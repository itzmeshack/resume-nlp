'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Exchanging code…');

  useEffect(() => {
    const run = async () => {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          setStatus(error.message || 'Could not complete sign-in.');
          setTimeout(() => router.replace('/signin'), 2000);
          return;
        }
        setStatus('Verified! Redirecting…');
        router.replace('/dashboard');
      } catch {
        setStatus('Unexpected error. Redirecting to sign in…');
        setTimeout(() => router.replace('/signin'), 2000);
      }
    };
    run();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-gray-900">
      <div className="text-center">
        <h1 className="text-xl font-semibold">{status}</h1>
      </div>
    </main>
  );
}
