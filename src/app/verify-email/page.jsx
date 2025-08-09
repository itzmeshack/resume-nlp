'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Toaster, toast } from 'react-hot-toast';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = (searchParams.get('email') || '').toLowerCase();

  const [resending, setResending] = useState(false);

  const resend = async () => {
    if (!email) {
      toast.error('No email found.');
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        toast.error(error.message || 'Could not resend verification email.');
        return;
      }
      toast.success('Verification email sent again. Check your inbox.');
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <Toaster position="top-center" />
      <section className="max-w-lg mx-auto px-6 pt-28 pb-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Verify your email</h1>
        <p className="text-gray-700 mb-6">
          We sent a verification link to <span className="font-semibold">{email || 'your email'}</span>.
          Click the link to finish creating your account.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={resend}
            disabled={resending}
            className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {resending ? 'Sending…' : 'Resend email'}
          </button>
          <button
            onClick={() => router.push('/signin')}
            className="border border-gray-300 px-5 py-2 rounded hover:bg-gray-50"
          >
            Back to Sign In
          </button>
        </div>
      </section>
      <Footer />
    </main>
  );
}
