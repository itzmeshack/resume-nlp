'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.10),transparent_40%),radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.10),transparent_40%)]">
      {/* Desktop sidebar */}
      <div className="flex">
        <Sidebar variant="desktop" />

        {/* Mobile sidebar (slide-in) */}
        <Sidebar
          variant="mobile"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        {/* Content column */}
        <div className="flex-1 min-h-screen">
          <Topbar onMenu={() => setMobileOpen(true)} />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-20">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
