import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import PageWrapper from '@/components/layout/PageWrapper';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getArtisanById } from '@/services/artisansService';
import { getJobs } from '@/services/jobsService';
import { getPayments } from '@/services/paymentsService';
import { calculateCommissionBreakdown, getCommissionSettings } from '@/services/commissionService';

export default function ArtisanProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [artisan, setArtisan] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState(null);
  const [tab, setTab] = useState('Job History');

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      const [artisanData, jobsData, paymentData, settingsData] = await Promise.all([
        getArtisanById(id),
        getJobs(),
        getPayments(),
        getCommissionSettings(),
      ]);

      setArtisan(artisanData);
      setJobs(jobsData.filter((job) => job.assignedArtisan === artisanData?.fullName));
      setPayments(paymentData.filter((payment) => payment.artisan === artisanData?.fullName));
      setSettings(settingsData);
    }

    loadData();
  }, [id]);

  const paymentRows = useMemo(() => {
    if (!settings) return [];

    return payments.map((payment) => {
      const breakdown = calculateCommissionBreakdown(payment.fullAmount, payment.type, settings);
      return { ...payment, breakdown };
    });
  }, [payments, settings]);

  if (!artisan) return null;

  return (
    <PageWrapper title="Artisan Profile">
      <section className="rounded-xl bg-neutral-50 p-6 shadow-card">
        <h3 className="font-display text-xl font-bold text-ink">{artisan.fullName}</h3>
        <div className="mt-3 grid gap-2 text-sm text-muted-300 sm:grid-cols-2">
          <p>Specialty: {artisan.specialty}</p>
          <p>WhatsApp: {artisan.whatsapp}</p>
          <p>Bank Account: {artisan.bankAccount}</p>
          <p>Joined: {formatDate(artisan.registrationDate)}</p>
          <p>Status: <Badge>{artisan.status}</Badge></p>
          <p>KYC: <Badge>{artisan.kycStatus}</Badge></p>
        </div>
      </section>

      <section className="mt-6 rounded-xl bg-neutral-50 p-6 shadow-card">
        <h4 className="font-display text-lg font-bold text-ink">Portfolio</h4>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {artisan.portfolio.map((image) => (
            <div key={image} className="aspect-square rounded-xl bg-neutral-200 p-2 text-xs text-muted-200">
              {image}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 flex gap-2">
        {['Job History', 'Payment History'].map((label) => (
          <button
            key={label}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === label ? 'bg-leather text-neutral-50' : 'bg-neutral-100 text-muted-300'}`}
            onClick={() => setTab(label)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'Job History' ? (
          <Table headers={['Job ID', 'Job Type', 'Product', 'Deadline', 'Status']}>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td className="px-4 py-3 font-semibold text-ink">{job.id}</td>
                <td className="px-4 py-3 text-muted-300">{job.jobType}</td>
                <td className="px-4 py-3 text-muted-300">{job.product}</td>
                <td className="px-4 py-3 text-muted-300">{formatDate(job.deadline)}</td>
                <td className="px-4 py-3"><Badge>{job.status}</Badge></td>
              </tr>
            ))}
          </Table>
        ) : (
          <Table headers={['Order ID', 'Stage 1', 'Stage 2', 'Total']}>
            {paymentRows.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-3 font-semibold text-ink">{payment.orderId}</td>
                <td className="px-4 py-3 text-success font-semibold">{formatCurrency(payment.breakdown.artisanStage1)}</td>
                <td className="px-4 py-3 text-success font-semibold">{formatCurrency(payment.breakdown.artisanStage2)}</td>
                <td className="px-4 py-3 text-muted-300">{formatCurrency(payment.fullAmount)}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </PageWrapper>
  );
}
