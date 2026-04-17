import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Bell,
  ClipboardCheck,
  Package,
  Settings,
  UserCheck,
  Wallet,
} from "lucide-react";
import PageWrapper from "../components/layout/PageWrapper";
import Button from "../components/ui/Button";
import StatCard from "../components/ui/StatCard";
import { formatCurrency } from "../lib/utils";
// Import from your authService to keep keys consistent
import { getSession, logout } from "../services/authService";

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
    // 1. Check session using the unified service
    const session = getSession();

    if (!session?.token || session?.role !== "ADMIN") {
      console.log("Unauthorized access attempt, redirecting to login...");
      router.replace("/login");
      return;
    }

    setAuthorized(true);

    // 2. Load Data with Fallbacks
    async function loadData() {
      try {
        // Replace these with your actual API calls when ready
        // const [statsRes, activityRes] = await Promise.all([getDashboardStats(), getRecentActivities()]);

        // MOCK DATA: This ensures the page doesn't hang while you're developing
        setStats({
          totalBrands: 12,
          totalArtisans: 45,
          activeOrders: 8,
          pendingApprovals: 3,
          totalEscrowBalance: 12500.5,
          totalCommissionEarned: 1200.0,
        });

        setActivities([
          {
            id: 1,
            title: "New Artisan joined",
            detail: "Oluwaseun added a new portfolio",
            icon: "UserCheck",
            timestamp: "2 mins ago",
          },
          {
            id: 2,
            title: "Order Completed",
            detail: "Order #1204 has been delivered",
            icon: "Package",
            timestamp: "1 hour ago",
          },
        ]);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
    }

    loadData();
  }, [router]);

  const onLogout = () => {
    logout(); // Uses the logic in authService.js
  };

  // 3. Simple Guard: If not authorized, show nothing (AppBootstrapLoader handles it)
  if (!authorized || !stats) {
    return null;
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
      {/* Statistics Grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Total Brands" value={stats.totalBrands} />
        <StatCard title="Total Artisans" value={stats.totalArtisans} />
        <StatCard title="Active Orders" value={stats.activeOrders} />
        <StatCard title="Pending Approvals" value={stats.pendingApprovals} />
        <StatCard
          title="Total Escrow Balance"
          value={formatCurrency(stats.totalEscrowBalance)}
        />
        <StatCard
          title="Total Commission Earned"
          value={formatCurrency(stats.totalCommissionEarned)}
        />
      </section>

      {/* Activity List */}
      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm border border-[#E8DED5]">
        <h3 className="font-display text-lg font-bold text-[#1A1513]">
          Recent System Activity
        </h3>
        <ul className="mt-5 space-y-4">
          {activities.length > 0 ? (
            activities.map((activity) => {
              const Icon = iconMap[activity.icon] || Bell;
              return (
                <li
                  key={activity.id}
                  className="flex items-start gap-4 rounded-xl bg-[#FCF9F7] p-4 transition-hover hover:bg-[#F5EFEA]"
                >
                  <span className="rounded-lg bg-[#6B3A2A]/10 p-2.5 text-[#6B3A2A]">
                    <Icon size={18} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#1A1513]">
                      {activity.title}
                    </p>
                    <p className="text-xs text-[#5A4B44] mt-0.5">
                      {activity.detail}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#A39289]">
                    {activity.timestamp}
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
