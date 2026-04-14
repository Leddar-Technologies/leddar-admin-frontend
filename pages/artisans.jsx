import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Table from '@/components/ui/Table';
import ArtisanRow from '@/components/admin/ArtisanRow';
import { getArtisans, updateArtisanStatus } from '@/services/artisansService';

const tabs = ['All', 'Pending Approval', 'Verified', 'Suspended'];

export default function ArtisansPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getArtisans().then(setRows);
  }, []);

  const filteredRows = useMemo(() => {
    if (activeTab === 'All') return rows;
    if (activeTab === 'Verified') return rows.filter((item) => item.kycStatus === 'Verified');
    if (activeTab === 'Suspended') return rows.filter((item) => item.status === 'Suspended');
    return rows.filter((item) => item.status === activeTab || item.kycStatus === activeTab);
  }, [rows, activeTab]);

  const handleAction = async (id, status) => {
    await updateArtisanStatus(id, status);
    const data = await getArtisans();
    setRows(data);
  };

  return (
    <PageWrapper title="Artisan Management">
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              activeTab === tab ? 'bg-leather text-neutral-50' : 'bg-neutral-100 text-muted-300'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <Table headers={['Full Name', 'Specialty', 'WhatsApp', 'KYC Status', 'Portfolio', 'Registration Date', 'Actions']}>
        {filteredRows.map((artisan) => (
          <ArtisanRow key={artisan.id} artisan={artisan} onAction={handleAction} />
        ))}
      </Table>
    </PageWrapper>
  );
}
