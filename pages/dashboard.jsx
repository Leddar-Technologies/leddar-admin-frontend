import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Bell, ClipboardCheck, Package, Settings, UserCheck, Wallet,
} from "lucide-react";
import PageWrapper from "../components/layout/PageWrapper";
import Button from "../components/ui/Button";
import StatCard from "../components/ui/StatCard";
import { formatCurrency } from "../lib/utils";
import { getSession, logout } from "../services/authService";
import { getDashboardStats } from "../services/dashboardService";

const iconMap = { UserCheck, ClipboardCheck, Package, Wallet, Bell, Settings };

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60)  return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats]           = useState(null);
  const [activities, setActivities] = useState([]);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session?.token || session?.role !== "ADMIN") {
      router.replace("/login");
      return;
    }
    setAuthorized(true);

    async function loadData() {
      try {
        const data = await getDashboardStats();
        setStats({
          totalBrands:           data.totalBrands,
          totalArtisans:         data.totalArtisans,
          activeOrders:          data.activeOrders,
          pendingApprovals:      data.pendingApprovals,
          totalEscrowBalance:    data.totalEscrowBalance,
        });
        setActivities(data.recentActivity || []);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError("Could not load dashboard data. Check your connection.");
      }
    }

    loadData();
  }, [router]);

  const onLogout = () => logout();

  if (!authorized || (!stats && !error)) {
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
      title="Admin Overview"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          Sign Out
        </Button>
      }
    >
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Statistics Grid */}
      {stats && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard title="Total Brands"        value={stats.totalBrands} />
          <StatCard title="Total Artisans"      value={stats.totalArtisans} />
          <StatCard title="Active Orders"       value={stats.activeOrders} />
          <StatCard title="Pending Approvals"   value={stats.pendingApprovals} />
          <StatCard title="Total Escrow Balance" value={formatCurrency(stats.totalEscrowBalance)} />
        </section>
      )}

      {/* Activity List */}
      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm border border-[#E8DED5]">
        <h3 className="font-display text-lg font-bold text-[#1A1513]">
          Recent System Activity
        </h3>
        <ul className="mt-5 space-y-4">
          {activities.length > 0 ? (
            activities.map((activity) => {
              const Icon = iconMap[activity.icon] || Package;
              return (
                <li
                  key={activity.id}
                  className="flex items-start gap-4 rounded-xl bg-[#FCF9F7] p-4 transition-hover hover:bg-[#F5EFEA]"
                >
                  <span className="rounded-lg bg-[#6B3A2A]/10 p-2.5 text-[#6B3A2A]">
                    <Icon size={18} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#1A1513]">{activity.title}</p>
                    <p className="text-xs text-[#5A4B44] mt-0.5">{activity.detail}</p>
                    {activity.note && (
                      <p className="text-xs text-[#A39289] mt-0.5 italic">{activity.note}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#A39289] whitespace-nowrap">
                    {timeAgo(activity.timestamp)}
                  </span>
                </li>
              );
            })
          ) : (
            <p className="text-sm text-center py-10 text-[#A39289]">
              No recent activity found.
            </p>
          )}
        </ul>
      </section>
    </PageWrapper>
  );
}
