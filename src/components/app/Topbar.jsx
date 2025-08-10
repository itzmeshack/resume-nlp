'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Bell, Menu } from 'lucide-react';

export default function Topbar({ onMenu = () => {} }) {
  const router = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) setEmail(data.user?.email || '');
    })();
    return () => { mounted = false; };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/signin');
  };

  return (
    <header className="h-16 sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/30">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center gap-3">
        {/* Mobile: hamburger */}
        <button
          onClick={onMenu}
          className="md:hidden p-2 rounded-md hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>

        {/* Search (hidden on very small) */}
        <div className="flex-1">
     <input
  placeholder="Search projects…"
  className="w-full md:w-96 rounded-xl border border-white/50 bg-white/60 px-4 py-2 text-sm text-black placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-400"
/>

        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-gray-100" aria-label="Notifications">
            <Bell className="w-5 h-5 text-gray-700" />
          </button>
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-xs text-gray-500">Signed in</span>
            <span className="text-sm font-medium truncate max-w-[160px]">{email}</span>
          </div>
          <button
            onClick={signOut}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
