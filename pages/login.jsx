import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';

const AUTH_STORAGE_KEY = 'leddar_admin_authenticated';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });

  const onSubmit = (event) => {
    event.preventDefault();
    localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-espresso p-4">
      <div className="w-full max-w-md rounded-xl bg-neutral-50 p-8 shadow-card">
        <Image src="/leddar-logo.svg" alt="Leddar" width={180} height={44} priority />
        <p className="mt-1 text-sm text-muted-200">Leddar Administration Panel.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm text-muted-300">
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
            />
          </label>

          <label className="block text-sm text-muted-300">
            Password
            <input
              type="password"
              required
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
            />
          </label>

          <Button type="submit" className="w-full" variant="primary">
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
