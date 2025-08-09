'use client';

import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ children }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.10),transparent_40%),radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.10),transparent_40%)]">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-h-screen">
          <Topbar />
          <div className="max-w-6xl mx-auto px-6 pt-6 pb-16">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
