import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Table from '@/components/ui/Table';
import BrandRow from '@/components/admin/BrandRow';
import { getBrands, updateBrandStatus } from '@/services/brandsService';

const tabs = ['All', 'Pending Approval', 'Verified', 'Suspended'];

export default function BrandsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getBrands().then(setRows);
  }, []);

  const filteredRows = useMemo(() => {
    if (activeTab === 'All') return rows;
    if (activeTab === 'Verified') return rows.filter((item) => item.kycStatus === 'Verified');
    if (activeTab === 'Suspended') return rows.filter((item) => item.status === 'Suspended');
    return rows.filter((item) => item.status === activeTab || item.kycStatus === activeTab);
  }, [rows, activeTab]);

  const handleAction = async (id, status) => {
    await updateBrandStatus(id, status);
    const data = await getBrands();
    setRows(data);
  };

  return (
    <PageWrapper title="Brand Management">
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

      <Table headers={['Business Name', 'Product Type', 'WhatsApp', 'KYC Status', 'Registration Date', 'Actions']}>
        {filteredRows.map((brand) => (
          <BrandRow key={brand.id} brand={brand} onAction={handleAction} />
        ))}
      </Table>
    </PageWrapper>
  );
}
