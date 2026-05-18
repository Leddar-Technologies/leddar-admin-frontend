"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import PageWrapper from "@/components/layout/PageWrapper";
import Badge from "@/components/ui/Badge";
import Table from "@/components/ui/Table";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getArtisanById,
  approveArtisan,
  rejectArtisan,
} from "@/services/artisansService";
import {
  Mail,
  Phone,
  MapPin,
  Shield,
  CreditCard,
  Briefcase,
  Hammer,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

export default function ArtisanProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [artisan, setArtisan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Job History");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      try {
        setLoading(true);
        const data = await getArtisanById(id);
        setArtisan(data);
      } catch (err) {
        console.error("Failed to load artisan profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleAction = async (type) => {
    if (!artisan?.userId) return;
    setActionLoading(type);
    try {
      if (type === "approve") {
        await approveArtisan(artisan.userId);
        setArtisan((prev) => ({ ...prev, status: "APPROVED" })); // ✅ instant update
      } else {
        await rejectArtisan(artisan.userId);
        setArtisan((prev) => ({ ...prev, status: "REJECTED" })); // ✅ instant update
      }
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading)
    return (
      <PageWrapper title="Loading Artisan...">
        <div className="flex h-96 items-center justify-center">
          <Spinner size="lg" color="leather" />
        </div>
      </PageWrapper>
    );

  if (!artisan)
    return (
      <PageWrapper title="Error">
        <div className="p-8 text-center bg-white rounded-2xl border border-[#E8DED5]">
          <p className="text-[#A39289]">Artisan not found or invalid ID.</p>
        </div>
      </PageWrapper>
    );

  const stats = [
    {
      label: "Total Jobs",
      value: artisan.jobs?.length || 0,
      icon: Briefcase,
      color: "text-blue-600",
    },
    {
      label: "Total Earnings",
      value: formatCurrency(
        artisan.payments?.reduce((acc, curr) => acc + (curr.amount || 0), 0) ||
          0,
      ),
      icon: CreditCard,
      color: "text-emerald-600",
    },
    {
      label: "KYC Status",
      value: artisan.kycStatus || "NOT_STARTED",
      icon: Shield,
      color: "text-leather",
    },
  ];

  const statusVariant =
    artisan.status === "APPROVED"
      ? "success"
      : artisan.status === "REJECTED"
        ? "destructive"
        : "warning";

  return (
    <PageWrapper
      title="Artisan Profile"
      subtitle={`Managing details for ${artisan.fullName}`}
    >
      {/* Header Info Card */}
      <section className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl shadow-ink/5">
        <div className="bg-atmosphere/30 p-8 border-b border-[#E8DED5]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-3xl font-bold text-ink">
                {artisan.fullName}
              </h3>
              <p className="text-[#A39289] mt-1">
                Artisan since {formatDate(artisan.registrationDate)}
              </p>
            </div>

            {/* Status + Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={statusVariant}>
                {artisan.status || "PENDING"}
              </Badge>
              <Badge variant="outline">ID: {artisan.id?.slice(0, 8)}...</Badge>
            </div>
          </div>
        </div>

        {/* 5-col info grid — email spans 2 cols */}
        <div className="grid grid-cols-5 gap-6 p-8">
          {/* Email — col-span-2 */}
          <div className="col-span-2 flex items-start gap-3 min-w-0">
            <div className="p-2 bg-atmosphere rounded-lg text-leather flex-shrink-0">
              <Mail size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">
                Email Address
              </p>
              <p className="text-ink font-medium text-sm break-all leading-snug mt-0.5">
                {artisan.email || "N/A"}
              </p>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 bg-atmosphere rounded-lg text-leather flex-shrink-0">
              <Phone size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">
                WhatsApp
              </p>
              <p className="text-ink font-medium text-sm mt-0.5">
                {artisan.whatsapp || "N/A"}
              </p>
            </div>
          </div>

          {/* Specialty */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 bg-atmosphere rounded-lg text-leather flex-shrink-0">
              <Hammer size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">
                Specialty
              </p>
              <p className="text-ink font-medium text-sm mt-0.5">
                {artisan.specialty || "N/A"}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 bg-atmosphere rounded-lg text-leather flex-shrink-0">
              <MapPin size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">
                Location
              </p>
              <p className="text-ink font-medium text-sm mt-0.5">
                {artisan.city && artisan.state
                  ? `${artisan.city}, ${artisan.state}`
                  : artisan.city || artisan.state || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#E8DED5] bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#A39289]">
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-ink">{item.value}</p>
              </div>
              <item.icon className={`h-8 w-8 ${item.color} opacity-20`} />
            </div>
          </div>
        ))}
      </div>

      {/* Portfolio Section */}
      {artisan.portfolio?.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-4 h-4 text-leather" />
            <h4 className="text-sm font-bold uppercase tracking-widest text-[#A39289]">
              Portfolio
            </h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {artisan.portfolio.map((item, idx) => (
              <a
                key={idx}
                href={item.url || item}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-2xl overflow-hidden border border-[#E8DED5] bg-atmosphere hover:shadow-md transition-shadow"
              >
                <img
                  src={item.url || item}
                  alt={`Portfolio ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="mt-10 mb-6 flex border-b border-[#E8DED5]">
        {["Job History", "Payment History"].map((t) => (
          <button
            key={t}
            className={`px-6 py-3 text-sm font-bold transition-all duration-200 ${
              activeTab === t
                ? "border-b-2 border-leather text-leather"
                : "text-[#A39289] hover:text-ink"
            }`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Data Section */}
      <div className="rounded-2xl border border-[#E8DED5] bg-white overflow-hidden shadow-sm">
        {activeTab === "Job History" ? (
          <Table headers={["Job ID", "Type", "Product", "Deadline", "Status"]}>
            {artisan.jobs?.length > 0 ? (
              artisan.jobs.map((job) => (
                <tr key={job.id} className="hover:bg-atmosphere/30">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-leather uppercase">
                    #{job.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-ink font-medium">
                    {job.type}
                  </td>
                  <td className="px-6 py-4 text-sm text-ink">
                    {job.productType}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#A39289]">
                    {job.deadline ? formatDate(job.deadline) : "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <Badge>{job.status}</Badge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-20 text-center text-[#A39289]">
                  No jobs assigned yet.
                </td>
              </tr>
            )}
          </Table>
        ) : (
          <Table headers={["Payment Ref", "Stage", "Status", "Amount"]}>
            {artisan.payments?.length > 0 ? (
              artisan.payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-atmosphere/30">
                  <td className="px-6 py-4 text-xs font-bold text-[#A39289] uppercase font-mono">
                    {payment.reference || payment.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-ink">
                    {payment.stage?.replace("_", " ")}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        payment.status === "RECEIVED" ? "success" : "warning"
                      }
                    >
                      {payment.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                    {formatCurrency(payment.amount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-20 text-center text-[#A39289]">
                  No payment history found.
                </td>
              </tr>
            )}
          </Table>
        )}
      </div>
    </PageWrapper>
  );
}
