'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AppBG3DWhite from './AppBG3DWhite'; // ⬅️ add this

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="relative min-h-screen">
      {/* 3D white background layer */}
     {/*  </*AppBG3DWhite /*>  this work for all background on  */}

      <div className="flex">
        {/* Desktop sidebar */}
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
