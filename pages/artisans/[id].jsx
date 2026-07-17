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
  Landmark,
  AlertCircle,
} from "lucide-react";

const PRODUCES_FOR_LABEL = {
  MALE:   "Male Wear",
  FEMALE: "Female Wear",
  UNISEX: "Unisex / Both",
};

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
      value: (artisan.kycStatus || "NOT_STARTED").replace(/_/g, " "),
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
              {artisan.producesFor && (
                <Badge variant="outline">
                  {PRODUCES_FOR_LABEL[artisan.producesFor] || artisan.producesFor}
                </Badge>
              )}
              <Badge variant="outline">ID: {artisan.id?.slice(0, 8).toUpperCase()}</Badge>
            </div>
          </div>
        </div>

        {/* 4-col info grid */}
        <div className="grid grid-cols-4 gap-6 px-8 pt-8 pb-4">
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

        {/* Specialty — full-width row */}
        {Array.isArray(artisan.specialty) && artisan.specialty.length > 0 && (
          <div className="px-8 pb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-atmosphere rounded-lg text-leather flex-shrink-0">
                <Hammer size={18} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289] mb-1.5">
                  Specialty
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {artisan.specialty.map((s) => (
                    <span
                      key={s}
                      className="inline-block rounded-full border border-[#E8DED5] bg-atmosphere px-3 py-1 text-xs font-semibold text-leather"
                    >
                      {s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
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

      {/* Physical Address Verification (QoreID) */}
      {(() => {
        const addr = artisan.address;
        if (!addr) return null;

        const statusCfg = {
          VERIFIED:     { label: "Verified ✓",    cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
          NOT_VERIFIED: { label: "Not Verified",   cls: "border-red-200 bg-red-50 text-red-700" },
          FAILED:       { label: "Submit Failed",  cls: "border-orange-200 bg-orange-50 text-orange-700" },
          IN_PROGRESS:  { label: "QoreID Pending", cls: "border-blue-200 bg-blue-50 text-blue-700" },
          PENDING:      { label: "Saved · Awaiting Job", cls: "border-amber-200 bg-amber-50 text-amber-700" },
        }[addr.status] || { label: "Not Entered", cls: "border-[#E8DED5] bg-atmosphere text-[#A39289]" };

        return (
          <div className="mt-8 rounded-2xl border border-[#E8DED5] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-leather" />
                <h4 className="text-sm font-bold uppercase tracking-widest text-[#A39289]">
                  Physical Address Verification (QoreID)
                </h4>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusCfg.cls}`}>
                {statusCfg.label}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">Street</p>
                <p className="text-ink font-medium mt-0.5">{addr.workAddress || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">City / State</p>
                <p className="text-ink font-medium mt-0.5">
                  {addr.city && addr.state ? `${addr.city}, ${addr.state}` : addr.city || addr.state || "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">LGA</p>
                <p className="text-ink font-medium mt-0.5">{addr.lgaName || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">Landmark</p>
                <p className="text-ink font-medium mt-0.5">{addr.landmark || "—"}</p>
              </div>
            </div>

            {(addr.qoreidRequestId || addr.submittedAt) && (
              <div className="mt-5 pt-4 border-t border-[#E8DED5] grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">QoreID Ref</p>
                  <p className="text-ink font-mono font-medium mt-0.5">
                    {addr.qoreidRequestId ? `#${addr.qoreidRequestId}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">Submitted</p>
                  <p className="text-ink font-medium mt-0.5">{addr.submittedAt ? formatDate(addr.submittedAt) : "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">Verified</p>
                  <p className="text-ink font-medium mt-0.5">{addr.verifiedAt ? formatDate(addr.verifiedAt) : "—"}</p>
                </div>
              </div>
            )}

            {(addr.qoreidRequest || addr.qoreidResponse) && (
              <details className="mt-4 group">
                <summary className="cursor-pointer text-xs font-semibold text-leather select-none">
                  View raw QoreID data (for support tickets)
                </summary>
                <div className="mt-3 space-y-3">
                  {addr.qoreidRequest && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289] mb-1">Request sent</p>
                      <pre className="rounded-xl bg-ink/95 text-[#d4d4d4] text-[11px] p-3 overflow-x-auto">
                        {JSON.stringify(addr.qoreidRequest, null, 2)}
                      </pre>
                    </div>
                  )}
                  {addr.qoreidResponse && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289] mb-1">Response received</p>
                      <pre className="rounded-xl bg-ink/95 text-[#d4d4d4] text-[11px] p-3 overflow-x-auto">
                        {JSON.stringify(addr.qoreidResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        );
      })()}

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

      {/* Bank Details Card */}
      <div className="mt-8 rounded-2xl border border-[#E8DED5] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Landmark className="w-4 h-4 text-leather" />
          <h4 className="text-sm font-bold uppercase tracking-widest text-[#A39289]">
            Payment Bank Details
          </h4>
        </div>
        {artisan.bankDetail ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">Bank Name</p>
              <p className="mt-1 text-sm font-semibold text-ink">{artisan.bankDetail.bankName}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">Account Name</p>
              <p className="mt-1 text-sm font-semibold text-ink">{artisan.bankDetail.accountName}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">Account Number</p>
              <p className="mt-1 text-sm font-semibold text-ink font-mono">{artisan.bankDetail.accountNumber}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">Bank Code</p>
              <p className="mt-1 text-sm font-semibold text-ink font-mono">{artisan.bankDetail.bankCode || "—"}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              This artisan has not added their bank details yet. Payments cannot be released until bank details are saved.
            </p>
          </div>
        )}
      </div>

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
                    {job.ref || `#${job.id.slice(0, 8).toUpperCase()}`}
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
                    {payment.reference || payment.ref || payment.id.slice(0, 8).toUpperCase()}
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
