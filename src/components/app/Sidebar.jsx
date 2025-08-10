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
  X,
} from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/tools', label: 'AI Tools', icon: Wand2 },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/reports', label: 'Reports', icon: FilePieChart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function NavLinks({ activePath }) {
  return (
    <nav className="p-3 space-y-1">
      {nav.map((item) => {
        const Icon = item.icon;
        const active = activePath === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 transition text-sm
              ${active ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ variant = 'desktop', open = false, onClose = () => {} }) {
  const pathname = usePathname();

  if (variant === 'desktop') {
    return (
      <aside className="hidden md:flex w-64 transition-all duration-300 bg-white/70 backdrop-blur-xl border-r border-white/30 min-h-screen sticky top-0 flex-col">
        <div className="h-16 flex items-center px-4 border-b border-white/30">
          <Link href="/" className="font-bold text-blue-600 text-lg">ResumeAI</Link>
        </div>
        <NavLinks activePath={pathname} />
      </aside>
    );
  }

  // Mobile variant: slide-in drawer + overlay
  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity md:hidden
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      {/* Drawer */}
      <aside
        className={`fixed z-50 inset-y-0 left-0 w-72 bg-white shadow-2xl border-r border-gray-200 md:hidden
          transform transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <Link href="/" className="font-bold text-blue-600 text-lg">ResumeAI</Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <NavLinks activePath={pathname} />
      </aside>
    </>
  );
}
