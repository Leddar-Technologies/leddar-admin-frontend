import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

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

  // Derived stats for the metric cards
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
        brand.payments?.reduce((acc, curr) => acc + (curr.amount || 0), 0),
      ),
      icon: CreditCard,
      color: "text-emerald-600",
    },
    {
      label: "KYC Status",
      value: brand.user?.kyc?.status || "NOT_STARTED",
      icon: Shield,
      color: "text-leather",
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
                Brand Member since {formatDate(brand.createdAt)}
              </p>
            </div>
            <div className="flex gap-3">
              <Badge
                variant={
                  brand.user?.status === "APPROVED" ? "success" : "warning"
                }
              >
                {brand.user?.status}
              </Badge>
              <Badge variant="outline">ID: {brand.id.slice(0, 8)}...</Badge>
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
              <p className="text-ink font-medium">{brand.user?.email}</p>
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
                <p className="mt-1 text-2xl font-bold text-ink">{item.value}</p>
              </div>
              <item.icon className={`h-8 w-8 ${item.color} opacity-20`} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div className="mt-10 mb-6 flex border-b border-[#E8DED5]">
        {["Orders", "Payment History"].map((t) => (
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
        {activeTab === "Orders" ? (
          <Table headers={["Order ID", "Type", "Status", "Total Amount"]}>
            {brand.orders?.length > 0 ? (
              brand.orders.map((order) => (
                <tr key={order.id} className="hover:bg-atmosphere/30">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-leather uppercase">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-ink font-medium">
                    {order.type}
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
        ) : (
          <Table headers={["Payment Ref", "Stage", "Status", "Amount"]}>
            {brand.payments?.length > 0 ? (
              brand.payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-atmosphere/30">
                  <td className="px-6 py-4 text-xs font-bold text-[#A39289] uppercase font-mono">
                    {payment.reference || payment.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-ink">
                    {payment.stage.replace("_", " ")}
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
