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
    <header className="h-16 sticky top-0 z-40 bg-black/70 backdrop-blur-xl border-b border-white/30">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between text-black">
        
        {/* Left: Mobile menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenu}
            className="md:hidden p-2 rounded-md hover:bg-black/5"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Center: optional search */}
        {/* Uncomment if you want search in center */}
        {/*
        <div className="flex-1 mx-4">
          <input
            placeholder="Search projects…"
            className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-2 text-sm
                       text-black placeholder-black/40 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        */}

        {/* Right: actions */}
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-black/5" aria-label="Notifications">
            <Bell className="w-5 h-5  text-white"  />
          </button>

          <div className="hidden sm:flex flex-col items-end">
           <span className="text-xs text-white">Signed in</span>

            <span className="text-sm  text-white font-medium truncate max-w-[160px]">{email}</span>
          </div>

          <button
            onClick={signOut}
            className="rounded-xl text-white cursor-pointer border border-black/15 px-3 py-2 text-sm hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
