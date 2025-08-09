'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';

export default function Topbar() {
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
      <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
        <div className="hidden md:flex items-center gap-3 flex-1">
          <input
            placeholder="Search projects…"
            className="w-full md:w-96 rounded-xl border border-white/50 bg-white/60 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-gray-100" aria-label="Notifications">
            <Bell className="w-5 h-5 text-gray-700" />
          </button>
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-xs text-gray-500">Signed in</span>
            <span className="text-sm font-medium">{email}</span>
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
