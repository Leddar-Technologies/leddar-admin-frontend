import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import PageWrapper from "@/components/layout/PageWrapper";
import Badge from "@/components/ui/Badge";
import Table from "@/components/ui/Table";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getBrandById } from "@/services/brandsService";
import {
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Shield,
  CreditCard,
  ShoppingBag,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  BadgeCheck,
  Fingerprint,
  Building2,
} from "lucide-react";

const kycStatusConfig = {
  VERIFIED: {
    label: "Verified",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle,
    badgeVariant: "success",
  },
  PENDING: {
    label: "Pending Review",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: Clock,
    badgeVariant: "warning",
  },
  FAILED: {
    label: "Failed",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: XCircle,
    badgeVariant: "error",
  },
  NOT_STARTED: {
    label: "Not Started",
    color: "text-[#A39289]",
    bg: "bg-atmosphere",
    border: "border-[#E8DED5]",
    icon: AlertCircle,
    badgeVariant: "outline",
  },
};

const idTypeLabels = {
  NIN: "National Identity Number (NIN)",
  CAC: "Corporate Affairs Commission (CAC)",
  VOTER: "Voter's Card (PVC)",
  VOTERS_CARD: "Voter's Card (PVC)",
};

export default function BrandProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Orders");

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      try {
        setLoading(true);
        const brandData = await getBrandById(id);
        setBrand(brandData);
      } catch (err) {
        console.error("Failed to load brand profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading)
    return (
      <PageWrapper title="Loading Brand...">
        <div className="flex h-96 items-center justify-center">
          <Spinner size="lg" color="leather" />
        </div>
      </PageWrapper>
    );

  if (!brand) return <PageWrapper title="Error">Brand not found.</PageWrapper>;

  const kycStatus = brand.kycStatus || "NOT_STARTED";
  const kycCfg = kycStatusConfig[kycStatus] || kycStatusConfig.NOT_STARTED;
  const KycIcon = kycCfg.icon;

  const stats = [
    {
      label: "Total Orders",
      value: brand.orders?.length || 0,
      icon: ShoppingBag,
      color: "text-blue-600",
    },
    {
      label: "Total Spent",
      value: formatCurrency(
        brand.payments
          ?.filter((p) => ["RECEIVED", "HELD_IN_ESCROW", "RELEASED"].includes(p.status))
          .reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0,
      ),
      icon: CreditCard,
      color: "text-emerald-600",
    },
    {
      label: "KYC Status",
      value: kycCfg.label,
      icon: Shield,
      color: kycCfg.color,
    },
  ];

  return (
    <PageWrapper
      title="Brand Profile"
      subtitle={`Managing details for ${brand.businessName}`}
    >
      {/* Header Info Card */}
      <section className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl shadow-ink/5">
        <div className="bg-atmosphere/30 p-8 border-b border-[#E8DED5]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-3xl font-bold text-ink">
                {brand.businessName}
              </h3>
              <p className="text-[#A39289] mt-1">
                Brand Member since {formatDate(brand.registrationDate)}
              </p>
            </div>
            <div className="flex gap-3">
              <Badge
                variant={brand.status === "APPROVED" ? "success" : "warning"}
              >
                {brand.status}
              </Badge>
              <Badge variant="outline">ID: {brand.id.slice(0, 8).toUpperCase()}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 p-8">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-atmosphere rounded-lg text-leather">
              <Mail size={18} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">
                Email Address
              </p>
              <p className="text-ink font-medium">{brand.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-2 bg-atmosphere rounded-lg text-leather">
              <Phone size={18} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">
                WhatsApp
              </p>
              <p className="text-ink font-medium">{brand.whatsapp || "N/A"}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-2 bg-atmosphere rounded-lg text-leather">
              <Briefcase size={18} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">
                Product Category
              </p>
              <p className="text-ink font-medium">
                {brand.productType?.join(", ") || "General"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-2 bg-atmosphere rounded-lg text-leather">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">
                Contact Person
              </p>
              <p className="text-ink font-medium">
                {brand.contactName || "Primary Contact"}
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
                <p className={`mt-1 text-2xl font-bold ${item.label === "KYC Status" ? item.color : "text-ink"}`}>
                  {item.value}
                </p>
              </div>
              <item.icon className={`h-8 w-8 ${item.color} opacity-20`} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div className="mt-10 mb-6 flex border-b border-[#E8DED5]">
        {["Orders", "Payment History", "KYC Verification"].map((t) => (
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
            {t === "KYC Verification" && kycStatus === "PENDING" && (
              <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-amber-500" />
            )}
          </button>
        ))}
      </div>

      {/* Data Section */}
      {activeTab === "Orders" && (
        <div className="rounded-2xl border border-[#E8DED5] bg-white overflow-hidden shadow-sm">
          <Table headers={["Order ID", "Type", "Status", "Total Amount"]}>
            {brand.orders?.length > 0 ? (
              brand.orders.map((order) => (
                <tr key={order.id} className="hover:bg-atmosphere/30">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-leather uppercase">
                    {order.ref || `#${order.id.slice(0, 8).toUpperCase()}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-ink font-medium">
                    {order.type === "SAMPLE" ? "Sample" : order.type === "PRODUCTION" ? "Production" : order.type || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <Badge>{order.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-ink">
                    {formatCurrency(order.totalAmount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-20 text-center text-[#A39289]">
                  No orders placed yet.
                </td>
              </tr>
            )}
          </Table>
        </div>
      )}

      {activeTab === "Payment History" && (
        <div className="rounded-2xl border border-[#E8DED5] bg-white overflow-hidden shadow-sm">
          <Table headers={["Payment Ref", "Stage", "Status", "Amount"]}>
            {brand.payments?.length > 0 ? (
              brand.payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-atmosphere/30">
                  <td className="px-6 py-4 text-xs font-bold text-[#A39289] uppercase font-mono">
                    {payment.reference || payment.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-sm text-ink">
                    {payment.stage?.replace(/_/g, " ") || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        payment.status === "RELEASED" ? "success"
                        : payment.status === "PENDING" ? "warning"
                        : payment.status === "FAILED"  ? "error"
                        : "default"
                      }
                    >
                      {payment.status || "—"}
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
        </div>
      )}

      {activeTab === "KYC Verification" && (
        <div className="space-y-6">
          {/* KYC Status Banner */}
          <div className={`flex items-center gap-4 rounded-2xl border ${kycCfg.border} ${kycCfg.bg} p-5`}>
            <KycIcon className={`w-7 h-7 flex-shrink-0 ${kycCfg.color}`} />
            <div>
              <p className={`text-base font-black ${kycCfg.color}`}>
                {kycCfg.label}
              </p>
              <p className="text-xs text-[#A39289] mt-0.5">
                {kycStatus === "VERIFIED"
                  ? "Identity has been successfully verified via QoreID."
                  : kycStatus === "FAILED"
                  ? "Verification failed. The ID details did not match QoreID records."
                  : kycStatus === "PENDING"
                  ? "Verification is in progress."
                  : "Brand has not submitted KYC yet."}
              </p>
            </div>
          </div>

          {/* Verification Details */}
          {kycStatus !== "NOT_STARTED" ? (
            <div className="rounded-2xl border border-[#E8DED5] bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F4EFEA]">
                <p className="text-[11px] uppercase tracking-wider font-black text-[#A39289]">
                  Verification Details
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#F4EFEA]">
                <div className="p-6 flex items-start gap-4">
                  <div className="p-2 bg-atmosphere rounded-lg text-leather flex-shrink-0">
                    <Fingerprint size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">
                      ID Type
                    </p>
                    <p className="text-ink font-semibold mt-1 text-sm">
                      {idTypeLabels[brand.kycIdType] || brand.kycIdType || "—"}
                    </p>
                  </div>
                </div>

                <div className="p-6 flex items-start gap-4">
                  <div className="p-2 bg-atmosphere rounded-lg text-leather flex-shrink-0">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">
                      Verification Provider
                    </p>
                    <p className="text-ink font-semibold mt-1 text-sm">
                      {brand.kycProvider || "QoreID"}
                    </p>
                  </div>
                </div>

                <div className="p-6 flex items-start gap-4">
                  <div className="p-2 bg-atmosphere rounded-lg text-leather flex-shrink-0">
                    <BadgeCheck size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">
                      {kycStatus === "VERIFIED" ? "Verified On" : "Submitted On"}
                    </p>
                    <p className="text-ink font-semibold mt-1 text-sm">
                      {brand.kycVerifiedAt
                        ? formatDate(brand.kycVerifiedAt)
                        : brand.kycSubmittedAt
                        ? formatDate(brand.kycSubmittedAt)
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#E8DED5] bg-atmosphere/30 p-16 text-center">
              <div className="w-14 h-14 rounded-full bg-[#E8DED5] flex items-center justify-center mb-2">
                <Shield className="w-7 h-7 text-[#A39289]" />
              </div>
              <h3 className="text-base font-bold text-ink">No KYC Submitted</h3>
              <p className="text-sm text-[#A39289] max-w-xs">
                This brand has not submitted their identity for verification yet.
              </p>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
}
