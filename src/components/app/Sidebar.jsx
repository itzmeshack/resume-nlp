'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Wand2,
  Library,
  FilePieChart,
  Settings,
} from 'lucide-react';
import { useState } from 'react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/tools', label: 'AI Tools', icon: Wand2 },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/reports', label: 'Reports', icon: FilePieChart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  return (
    <aside
      className={`${
        open ? 'w-60' : 'w-16'
      } transition-all duration-300 bg-white/70 backdrop-blur-xl border-r border-white/30 min-h-screen sticky top-0 hidden md:flex flex-col`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/30">
        <Link href="/" className="font-bold text-blue-600">
          {open ? 'ResumeAI' : 'R'}
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Toggle sidebar"
        >
          {open ? '⟨' : '⟩'}
        </button>
      </div>

      <nav className="p-3 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 transition ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              {open && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
