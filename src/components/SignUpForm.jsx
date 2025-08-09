'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function SignUpForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const phone = form.phone.trim();

    if (!name || !email || !password || !phone) {
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, phone },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      // ✅ If email already registered & verified → Supabase returns an error -> stay on page
      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
          toast.error('Email already exists. Please try another email.');
        } else {
          toast.error(error.message || 'Sign up failed.');
        }
        return; // do not redirect
      }

      // At this point Supabase accepted the sign-up and sent a verification email.
      // Distinguish:
      // - brand-new -> identities.length === 1 (OK to redirect to verify page)
      // - existing but unverified -> identities.length === 0 (we treat as "exists" and stay here)
      const identities = Array.isArray(data?.user?.identities) ? data.user.identities : [];

      if (identities.length === 0) {
        // Email is in the system but unverified → stay on page and show "exists"
        toast.error('Email already exists. Please try another email.');
        return; // no redirect
      }

      // 🎉 Brand-new sign-up → go to verify page
      toast.success('Account created. Please verify your email.');
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch {
      toast.error('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const signUpWithGoogle = async () => {
    setOauthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) toast.error(error.message || 'Google sign-in failed.');
    } catch {
      toast.error('Google sign-in failed.');
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <div
      className="
        w-full max-w-md p-8 mt-24 mb-16
        rounded-2xl shadow-2xl border
        bg-white/10 backdrop-blur-xl
        flex flex-col items-center animate-float
        border-white/30 text-white
      "
      style={{
        boxShadow: '0 8px 32px 0 rgba(59,130,246,0.20), 0 2px 8px 0 rgba(0,0,0,0.11)',
        border: '2px solid rgba(255,255,255,0.3)',
      }}
    >
      <h1 className="text-3xl font-bold text-blue-300 mb-6 text-center">Sign Up</h1>

      <form onSubmit={handleSubmit} className="space-y-5 w-full">
        <div>
          <label className="block mb-2 text-sm font-medium text-white">Name</label>
          <input
            type="text" name="name" value={form.name} onChange={handleChange} required
            className="w-full border border-white/20 px-4 py-2 rounded bg-white/20 backdrop-blur-sm placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Your Name"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-white">Email</label>
          <input
            type="email" name="email" value={form.email} onChange={handleChange} required
            className="w-full border border-white/20 px-4 py-2 rounded bg-white/20 backdrop-blur-sm placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="you@email.com"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-white">Password</label>
          <input
            type="password" name="password" value={form.password} onChange={handleChange} required
            className="w-full border border-white/20 px-4 py-2 rounded bg-white/20 backdrop-blur-sm placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-white">Phone Number</label>
          <input
            type="tel" name="phone" value={form.phone} onChange={handleChange} required
            className="w-full border border-white/20 px-4 py-2 rounded bg-white/20 backdrop-blur-sm placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="+123456789"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold shadow disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Sign Up'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 w-full">
        <div className="flex-1 h-px bg-white/40" />
        <span className="text-gray-200 text-sm">OR</span>
        <div className="flex-1 h-px bg-white/40" />
      </div>

      <button
        onClick={signUpWithGoogle}
        disabled={oauthLoading}
        className="w-full flex items-center justify-center gap-2 border border-white/20 py-2 rounded-lg hover:bg-white/20 transition mb-2 font-medium text-white backdrop-blur-md bg-white/10 disabled:opacity-50"
      >
        <FcGoogle className="w-5 h-5" />
        {oauthLoading ? 'Redirecting…' : 'Continue with Google'}
      </button>

      <button
        disabled
        className="w-full flex items-center justify-center gap-2 border border-white/20 py-2 rounded-lg bg-white/5 text-white opacity-50 cursor-not-allowed"
        title="Apple sign-in coming soon"
      >
        <FaApple className="w-5 h-5" />
        Continue with Apple (soon)
      </button>

      <p className="text-sm text-white text-center mt-6">
        Already have an account?{' '}
        <a href="/signin" className="text-blue-300 hover:underline font-medium">
          Sign In
        </a>
      </p>
    </div>
  );
}
