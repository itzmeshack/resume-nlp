'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Toaster, toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const requestReset = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email.');

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message || 'Could not send reset email.');
        return;
      }
      toast.success('Reset link sent! Check your inbox.');
      setEmail('');
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
        <h1 className="text-3xl font-bold mb-4">Forgot Password</h1>
        <p className="text-gray-600 mb-6">
          Enter your account email and we’ll send you a link to reset your password.
        </p>
        <form onSubmit={requestReset} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium">Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@email.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      </section>
      <Footer />
    </main>
  );
}
