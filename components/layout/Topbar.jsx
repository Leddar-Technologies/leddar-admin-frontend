import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Bell, Menu } from 'lucide-react';
import { getNotifications } from '@/services/notificationsService';

export default function Topbar({ onMenuClick }) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getNotifications()
      .then((items) => setUnreadCount(items.filter((n) => !n.isRead).length))
      .catch(() => setUnreadCount(0));
  }, []);

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

        <button
          type="button"
          onClick={() => router.push('/notifications')}
          className="relative rounded-lg bg-neutral-50 p-2 text-ink shadow-card transition-colors hover:bg-atmosphere"
          title="View notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-bold text-espresso">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
