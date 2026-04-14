import { Bell, Menu } from 'lucide-react';

export default function Topbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-300 bg-cream/90 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-neutral-500 p-2 text-ink lg:hidden"
            onClick={onMenuClick}
          >
            <Menu size={16} />
          </button>
          <h1 className="font-display text-xl font-bold text-ink">Welcome, Admin</h1>
        </div>

        <button type="button" className="relative rounded-lg bg-neutral-50 p-2 text-ink shadow-card">
          <Bell size={18} />
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-bold text-espresso">
            3
          </span>
        </button>
      </div>
    </header>
  );
}
