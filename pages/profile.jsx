import { useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Button from '@/components/ui/Button';

export default function ProfilePage() {
  const [adminInfo, setAdminInfo] = useState({ name: 'System Admin', contact: '+2348000000000' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  return (
    <PageWrapper title="Admin Profile">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl bg-neutral-50 p-6 shadow-card">
          <h3 className="font-display text-xl font-bold text-ink">Admin Info</h3>
          <div className="mt-4 space-y-3">
            <label className="block text-sm text-muted-300">
              Name
              <input
                value={adminInfo.name}
                onChange={(event) => setAdminInfo((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
              />
            </label>
            <label className="block text-sm text-muted-300">
              Contact Info
              <input
                value={adminInfo.contact}
                onChange={(event) => setAdminInfo((prev) => ({ ...prev, contact: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
              />
            </label>
            <Button>Save Changes</Button>
          </div>
        </section>

        <section className="rounded-xl bg-neutral-50 p-6 shadow-card">
          <h3 className="font-display text-xl font-bold text-ink">Security</h3>
          <div className="mt-4 space-y-3">
            <label className="block text-sm text-muted-300">
              Current Password
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
              />
            </label>
            <label className="block text-sm text-muted-300">
              New Password
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
              />
            </label>
            <label className="block text-sm text-muted-300">
              Confirm Password
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
              />
            </label>
            <Button>Update Password</Button>
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
