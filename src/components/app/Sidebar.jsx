'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  ChevronRight,
  LayoutDashboard,
  FolderKanban,
  Wand2,
  FileBarChart2,
  Library,
  Settings
} from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/ai-tools', label: 'AI Tools', icon: Wand2 },
  { href: '/reports', label: 'Reports', icon: FileBarChart2 },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function NavLinks({ collapsed }) {
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
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition
              ${active
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-100 text-gray-900'}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span
              className={`transition-opacity duration-200 ${
                collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ variant = 'desktop', open = false, onClose }) {

const [collapsed, setCollapsed] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  }
  return false;
});

  if (variant === 'desktop') {
    return (
      <aside
        className={`hidden md:flex md:flex-col transition-[width] duration-300
        ${collapsed ? 'md:w-16' : 'md:w-64'}
        md:border-r md:border-gray-200 md:bg-white md:min-h-screen`}
      >
        <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
          
          {/* Always render logo (never conditionally remove) */}
          <Link
            href="/"
            className={`font-extrabold text-lg tracking-tight text-blue-600 transition-opacity ${
              collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            }`}
          >
            ResumeAI
          </Link>

          <button
            onClick={() => {
              const next = !collapsed;
              setCollapsed(next);
              localStorage.setItem('sidebar-collapsed', next);
            }}
            className="p-1 rounded-lg hover:bg-gray-100 transition"
          >
            <ChevronRight
              className={`w-6 h-6 text-black transition-transform ${
                collapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        <div className="px-2 py-3 overflow-y-auto">
          <NavLinks collapsed={collapsed} />
        </div>
      </aside>
    );
  }

  // Mobile
  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl border-r border-gray-200 flex flex-col">
        <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
          <Link href="/" className="font-extrabold text-lg tracking-tight text-blue-600">
            ResumeAI
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 p-1 hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>
        <div className="px-3 py-3 overflow-y-auto">
          <NavLinks collapsed={false} />
        </div>
      </aside>
    </div>
  );
}
