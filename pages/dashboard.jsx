import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Bell, ClipboardCheck, Package, Settings, UserCheck, Wallet } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import { formatCurrency } from '@/lib/utils';
import { getDashboardStats, getRecentActivities } from '@/services/dashboardService';

const AUTH_STORAGE_KEY = 'leddar_admin_authenticated';

const iconMap = {
  UserCheck,
  ClipboardCheck,
  Package,
  Wallet,
  Bell,
  Settings,
};

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const isAuthorized = localStorage.getItem(AUTH_STORAGE_KEY) === 'true';

    if (!isAuthorized) {
      router.replace('/login');
      return;
    }

    setAuthorized(true);

    async function loadData() {
      const [statsRes, activityRes] = await Promise.all([getDashboardStats(), getRecentActivities()]);
      setStats(statsRes);
      setActivities(activityRes);
    }

    loadData();
  }, [router]);

  const onLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.push('/login');
  };

  if (!authorized || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-3 rounded-xl bg-neutral-50 px-6 py-5 shadow-card">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-leather/25 border-t-leather" />
          <p className="text-sm font-semibold text-ink">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper
      title="Dashboard"
      actions={
        <Button variant="outline" size="sm" onClick={onLogout}>
          Logout
        </Button>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Total Brands" value={stats.totalBrands} />
        <StatCard title="Total Artisans" value={stats.totalArtisans} />
        <StatCard title="Active Orders" value={stats.activeOrders} />
        <StatCard title="Pending Approvals" value={stats.pendingApprovals} />
        <StatCard title="Total Escrow Balance" value={formatCurrency(stats.totalEscrowBalance)} />
        <StatCard title="Total Commission Earned" value={formatCurrency(stats.totalCommissionEarned)} />
      </section>

      <section className="mt-6 rounded-xl bg-neutral-50 p-5 shadow-card">
        <h3 className="font-display text-xl font-bold text-ink">Recent Activity</h3>
        <ul className="mt-4 space-y-3">
          {activities.map((activity) => {
            const Icon = iconMap[activity.icon] || Bell;
            return (
              <li key={activity.id} className="flex items-start gap-3 rounded-xl bg-neutral-100 p-3">
                <span className="rounded-lg bg-gold/20 p-2 text-leather">
                  <Icon size={16} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{activity.title}</p>
                  <p className="text-xs text-muted-200">{activity.detail}</p>
                </div>
                <span className="ml-auto text-xs text-muted-200">{activity.timestamp}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </PageWrapper>
  );
}
