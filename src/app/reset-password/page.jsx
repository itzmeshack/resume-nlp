'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Toaster, toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // when user clicks the email link, Supabase sets a session → allow update
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSessionReady(!!session);
    })();
  }, []);

  const updatePassword = async (e) => {
    e.preventDefault();
    if (!pw1 || !pw2) return toast.error('Enter and confirm your new password.');
    if (pw1 !== pw2) return toast.error('Passwords do not match.');

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) {
        toast.error(error.message || 'Could not update password.');
        return;
      }
      toast.success('Password updated! Please sign in.');
      router.replace('/signin');
    } catch {
      toast.error('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <Toaster position="top-center" />
      <section className="max-w-md mx-auto px-6 pt-28 pb-16">
        <h1 className="text-3xl font-bold mb-4">Reset Password</h1>
        {!sessionReady ? (
          <p className="text-gray-600">
            Open this page from the password reset link in your email.
          </p>
        ) : (
          <form onSubmit={updatePassword} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium">New Password</label>
              <input
                type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} required
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">Confirm Password</label>
              <input
                type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </section>
      <Footer />
    </main>
  );
}
