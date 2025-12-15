// src/components/app/Sidebar.jsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, LayoutDashboard, FolderKanban, Wand2, FileBarChart2, Library, Settings } from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/ai-tools', label: 'AI Tools', icon: Wand2 },
  { href: '/reports', label: 'Reports', icon: FileBarChart2 },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function NavLinks({ onClick }) {
  const pathname = usePathname();
  return (
    <nav className="mt-4 space-y-1">
      {nav.map(item => {
        const Icon = item.icon;
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition
              ${active
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-100 text-gray-900'}`}
          >
            <Icon className="w-4 h-4" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ variant = 'desktop', open = false, onClose }) {
  if (variant === 'desktop') {
    return (
      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:border-r md:border-gray-200 md:bg-white md:min-h-screen">
        <div className="px-4 py-4 border-b border-gray-200">
          <Link href="/" className="block font-extrabold text-lg tracking-tight">
            <span className="text-blue-600">ResumeAI</span>
          </Link>
        </div>
        <div className="px-3 py-3 overflow-y-auto">
          <NavLinks />
        </div>
      </aside>
    );
  }

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl border-r border-gray-200 flex flex-col">
        <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
          <Link href="/" className="font-extrabold text-lg tracking-tight" onClick={onClose}>
            <span className="text-blue-600">ResumeAI</span>
          </Link>
          <button onClick={onClose} className="rounded-lg border border-gray-300 p-1 hover:bg-gray-100" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-3 py-3 overflow-y-auto">
          <NavLinks onClick={onClose} />
        </div>
      </aside>
    </div>
  );
}
