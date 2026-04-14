import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Table from '@/components/ui/Table';
import NotificationItem from '@/components/admin/NotificationItem';
import { getNotifications } from '@/services/notificationsService';

const tabs = ['All', 'Sent to Brands', 'Sent to Artisans', 'System Alerts'];

export default function NotificationsPage() {
  const [rows, setRows] = useState([]);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    getNotifications().then(setRows);
  }, []);

  const filteredRows = useMemo(() => {
    if (activeTab === 'All') return rows;
    if (activeTab === 'Sent to Brands') return rows.filter((item) => item.audience === 'Brand');
    if (activeTab === 'Sent to Artisans') return rows.filter((item) => item.audience === 'Artisan');
    return rows.filter((item) => item.audience === 'System');
  }, [rows, activeTab]);

  return (
    <PageWrapper title="Notifications">
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === tab ? 'bg-leather text-neutral-50' : 'bg-neutral-100 text-muted-300'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <Table headers={['Recipient', 'Channel', 'Trigger Event', 'Message Preview', 'Timestamp', 'Status']}>
        {filteredRows.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </Table>
    </PageWrapper>
  );
}
