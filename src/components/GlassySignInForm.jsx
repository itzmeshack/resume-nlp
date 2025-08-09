'use client';

import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function GlassySignInForm() {
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in both fields.');
      return;
    }
    toast.success('Signed in successfully!');
    setForm({ email: '', password: '' });
  };

  return (
    <div
      className="
        w-full max-w-md p-8 mt-24 mb-16
        rounded-2xl shadow-2xl border
        bg-white/10 backdrop-blur-xl
        flex flex-col items-center animate-float transition-all
        border-white/30
      "
      style={{
        boxShadow: "0 8px 32px 0 rgba(59,130,246,0.18), 0 2px 8px 0 rgba(0,0,0,0.09)",
        border: "2px solid rgba(255,255,255,0.3)",
      }}
    >
      <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">Sign In</h1>
      <form onSubmit={handleSubmit} className="space-y-5 w-full">
        <div>
          <label className="block mb-2 text-sm text-white font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border border-gray-200 px-4 py-2 rounded bg-white/30 backdrop-blur-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="you@email.com"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm text-white font-medium">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full border border-gray-200 px-4 py-2 rounded bg-white/30 backdrop-blur-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow font-semibold"
        >
          Sign In
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 w-full">
        <div className="flex-1 h-px bg-white/50" />
        <span className="text-gray-400 text-sm">OR</span>
        <div className="flex-1 h-px bg-white/50" />
      </div>

      <button className="w-full flex items-center justify-center gap-2 border border-gray-200 py-2 rounded-lg hover:bg-white/30 transition mb-2 font-medium text-white backdrop-blur-md bg-white/20">
        <FcGoogle className="w-5 h-5" />
        Continue with Google
      </button>
      <button className="w-full flex items-center justify-center gap-2 border border-gray-200 py-2 rounded-lg hover:bg-white/30 transition font-medium text-white backdrop-blur-md bg-white/20">
        <FaApple className="w-5 h-5" />
        Continue with Apple
      </button>

      <p className="text-sm text-gray-300 text-center mt-6">
        Don&apos;t have an account?{' '}
        <a href="/signup" className="text-blue-400 hover:underline font-medium">
          Sign Up
        </a>
      </p>
    </div>
  );
}
