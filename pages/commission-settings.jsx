import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import CommissionSettingsCard from '@/components/ui/CommissionSettingsCard';
import { getCommissionSettings, updateCommissionSettings } from '@/services/commissionService';

export default function CommissionSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(null);

  useEffect(() => {
    async function loadData() {
      const data = await getCommissionSettings();
      setSettings(data);
      setForm(data);
    }

    loadData();
  }, []);

  const total = useMemo(() => {
    if (!form) return 0;
    return Number(form.adminCommissionPercent || 0) + Number(form.artisanStage1Percent || 0) + Number(form.artisanStage2Percent || 0);
  }, [form]);

  const isValid = total === 100;

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!isValid) return;

    const updated = await updateCommissionSettings(form);
    setSettings(updated);
  };

  if (!settings || !form) return null;

  return (
    <PageWrapper title="Commission Settings">
      <CommissionSettingsCard
        currentSettings={settings}
        form={form}
        total={total}
        isValid={isValid}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    </PageWrapper>
  );
}
