// src/components/app/AppShell.jsx
'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="min-h-dvh bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.10),transparent_40%),radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.10),transparent_40%)]">
      <div className="flex">
        {/* Desktop sidebar (hidden on small screens) */}
        <div className="hidden md:block w-[280px] shrink-0">
          <Sidebar variant="desktop" />
        </div>

        {/* Mobile sidebar (slide-in) */}
        {/* Backdrop */}
        {mobileOpen && (
          <button
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
          />
        )}
        {/* Drawer */}
        <div
          className={[
            'fixed inset-y-0 left-0 z-50 w-72 md:hidden',
            'bg-white border-r border-gray-200 shadow-xl',
            'transform transition-transform duration-200 ease-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
          role="dialog"
          aria-modal="true"
          aria-hidden={!mobileOpen}
        >
          <Sidebar
            variant="mobile"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
          />
        </div>

        {/* Content column */}
        <div className="flex-1 min-h-dvh min-w-0">
          {/* Sticky topbar */}
          <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
            <Topbar onMenu={() => setMobileOpen(true)} />
          </div>

          {/* Page content */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
