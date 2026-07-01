import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getSession } from "../../services/authService";

export default function AdminRoute({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();

    if (!session?.token || session?.role !== "ADMIN") {
      router.replace("/login");
      return;
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-3 rounded-xl bg-neutral-50 px-6 py-5 shadow-card">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-leather/25 border-t-leather" />
          <p className="text-sm font-semibold text-ink">
            Checking authorization...
          </p>
        </div>
      </div>
    );
  }

  return children;
}
