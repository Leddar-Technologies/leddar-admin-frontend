import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Bell,
  Briefcase,
  ClipboardList,
  CreditCard,
  Gauge,
  Package,
  Percent,
  ShoppingBag,
  User,
  Users,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Gauge },
  { label: 'Brands', href: '/brands', icon: ShoppingBag },
  { label: 'Artisans', href: '/artisans', icon: Users },
  { label: 'Quotes', href: '/quotes', icon: ClipboardList },
  { label: 'Orders', href: '/orders', icon: Package },
  { label: 'Jobs', href: '/jobs', icon: Briefcase },
  { label: 'Payments', href: '/payments', icon: CreditCard },
  { label: 'Commission Settings', href: '/commission-settings', icon: Percent },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Profile', href: '/profile', icon: User },
];

export default function Sidebar({ onNavigate }) {
  const router = useRouter();

  return (
    <aside className="h-full w-72 bg-espresso text-neutral-50">
      <div className="border-b border-white/10 px-6 py-6">
        <p className="font-display text-2xl font-bold text-gold">Leddar</p>
        <p className="text-xs text-neutral-500">Administration Panel</p>
      </div>
      <nav className="px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-lg border-l-4 px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'border-gold bg-white/10 text-gold'
                      : 'border-transparent text-neutral-500 hover:bg-white/10 hover:text-neutral-50'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
