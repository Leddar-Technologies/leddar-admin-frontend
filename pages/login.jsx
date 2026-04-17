import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { Eye, EyeOff } from "lucide-react"; // Import Icons

import { getSession } from "../services/authService";
import { loginAdmin } from "../store/slices/adminAuthSlice";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { loading, error, admin } = useSelector((state) => state.adminAuth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [isMounted, setIsMounted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for toggle

  useEffect(() => {
    setIsMounted(true);
    const session = getSession();
    if (session?.token && session?.role === "ADMIN") {
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    if (admin && (admin.role === "ADMIN" || admin.token)) {
      setRedirecting(true);
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [admin, router]);

  const onSubmit = (event) => {
    event.preventDefault();
    dispatch(loginAdmin(form));
  };

  if (!isMounted) return null;

  const isBusy = loading || redirecting;
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#14110F] p-4 font-sans">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-2xl border border-[#E8DED5]">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/leddar-logo.svg"
            alt="Leddar"
            width={160}
            height={40}
            priority
            className="h-10 w-auto"
          />
          <div className="mt-4 inline-block rounded-full bg-amber-50 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-900 border border-amber-100">
            Admin Access Only
          </div>
        </div>

        <form className="space-y-6" onSubmit={onSubmit}>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A4B44] mb-2 ml-1">
              Administrator Email
            </label>
            <input
              type="email"
              required
              disabled={isBusy}
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full rounded-xl border border-[#D7CBC1] bg-[#FCF9F7] px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#6B3A2A] transition-all disabled:opacity-60"
              placeholder="admin@leddar.com"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5A4B44] mb-2 ml-1">
              Secure Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} // Dynamic type
                required
                disabled={isBusy}
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full rounded-xl border border-[#D7CBC1] bg-[#FCF9F7] pl-4 pr-12 py-3.5 outline-none focus:ring-2 focus:ring-[#6B3A2A] transition-all disabled:opacity-60"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isBusy}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A39289] hover:text-[#6B3A2A] transition-colors disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-center text-[13px] font-semibold text-red-700 border border-red-100 animate-in fade-in zoom-in-95">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full py-4 text-xs font-bold uppercase tracking-[0.25em] shadow-xl transition-all hover:bg-[#4A281D] active:scale-[0.98]"
            variant="primary"
            disabled={isBusy}
          >
            {isBusy ? (
              <div className="flex items-center justify-center gap-3">
                <Spinner size="sm" />
                <span>{redirecting ? "Redirecting..." : "Authorizing..."}</span>
              </div>
            ) : (
              "Sign In to Console"
            )}
          </Button>
        </form>

        <div className="mt-10 pt-6 border-t border-gray-100 text-center">
          <p className="text-[10px] uppercase tracking-widest text-[#A39289] font-semibold">
            &copy; {currentYear} Leddar Manufacturing
          </p>
        </div>
      </div>
    </div>
  );
}
