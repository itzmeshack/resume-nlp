'use client';

import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';

export default function SignUpForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Try to create profile row (only works when user is authenticated)
  const ensureProfile = async (userId) => {
    if (!userId) return;
    await supabase.from('profiles').upsert(
      {
        id: userId,
        full_name: form.name,
        phone: form.phone
      },
      { onConflict: 'id' }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, phone } = form;

    if (!name || !email || !password || !phone) {
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      // 1) PRE-CHECK: phone uniqueness in profiles
      const { data: existingPhone, error: phoneErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();

      if (phoneErr) {
        console.error(phoneErr);
        toast.error('Could not validate phone. Please try again.');
        setLoading(false);
        return;
      }
      if (existingPhone) {
        toast.error('A user with this phone number already exists.');
        setLoading(false);
        return;
      }

      // 2) SIGN UP: Supabase will enforce unique email
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, phone },
          emailRedirectTo: `${window.location.origin}/signin`
        }
      });

      if (error) {
        // Friendly message for common duplicate email case
        const msg = error.message?.toLowerCase() || '';
        if (msg.includes('user already registered') || msg.includes('already exists')) {
          toast.error('This email is already registered. Try signing in instead.');
        } else {
          toast.error(error.message || 'Sign up failed.');
        }
        setLoading(false);
        return;
      }

      // 3) If email confirmation is disabled or Supabase returned a session, create profile now
      const userId = data.user?.id;
      if (userId) {
        await ensureProfile(userId);
      }

      toast.success(
        'Account created! Check your email to verify your address before signing in.'
      );
      setForm({ name: '', email: '', password: '', phone: '' });
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/signin`
        }
      });
      if (error) toast.error(error.message);
    } catch {
      toast.error('OAuth failed. Try again.');
    }
  };

  return (
    <div
      className="
        w-full max-w-md p-8 mt-24 mb-16
        rounded-2xl shadow-2xl border
        bg-white/10 backdrop-blur-xl
        flex flex-col items-center animate-float
        border-white/30
        text-white
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
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border border-white/20 px-4 py-2 rounded bg-white/20 backdrop-blur-sm placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Your Name"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-white">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border border-white/20 px-4 py-2 rounded bg-white/20 backdrop-blur-sm placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="you@email.com"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-white">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full border border-white/20 px-4 py-2 rounded bg-white/20 backdrop-blur-sm placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-white">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
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
        onClick={() => signInWithProvider('google')}
        className="w-full flex items-center justify-center gap-2 border border-white/20 py-2 rounded-lg hover:bg-white/20 transition mb-2 font-medium text-white backdrop-blur-md bg-white/10"
      >
        <FcGoogle className="w-5 h-5" />
        Continue with Google
      </button>

      <button
        onClick={() => signInWithProvider('apple')}
        className="w-full flex items-center justify-center gap-2 border border-white/20 py-2 rounded-lg hover:bg-white/20 transition font-medium text-white backdrop-blur-md bg-white/10"
      >
        <FaApple className="w-5 h-5" />
        Continue with Apple
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
