import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function PageWrapper({ title, children, actions }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-cream">
      <div className="hidden lg:block w-72 shrink-0">
        <div className="fixed top-0 left-0 h-screen w-72 overflow-y-auto">
          <Sidebar />
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="h-full w-72">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
          <button className="flex-1 bg-black/30" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
            {actions}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
