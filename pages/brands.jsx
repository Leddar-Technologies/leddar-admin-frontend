"use client";

import { useEffect, useMemo, useState } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import Table from "@/components/ui/Table";
import BrandRow from "@/components/ui/BrandRow";
import Spinner from "@/components/ui/Spinner";
import { getBrands, approveUser, rejectUser } from "@/services/brandsService";
import { Users, ShieldCheck, Clock, UserX, Search } from "lucide-react";

const tabs = [
  { id: "All", label: "All Brands", icon: Users },
  { id: "Pending Approval", label: "Pending", icon: Clock },
  { id: "Verified", label: "Verified", icon: ShieldCheck },
  { id: "Suspended", label: "Suspended", icon: UserX },
];

export default function BrandsPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadBrands = async () => {
    try {
      setLoading(true);
      const data = await getBrands(activeTab);
      // Ensure data is an array and filter for brands only
      const brandOnlyData = Array.isArray(data)
        ? data.filter((user) => user.role === "BRAND")
        : [];
        console.log("First brand:", brandOnlyData[0]);
      setRows(brandOnlyData);
    } catch (err) {
      console.error("Failed to fetch brands:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, [activeTab]);

  const filteredRows = useMemo(() => {
    let result = [...rows];

    // Status filtering
    if (activeTab === "Verified")
      result = result.filter(
        (item) => item.status === "APPROVED" || item.status === "ACTIVE",
      );
    if (activeTab === "Suspended")
      result = result.filter(
        (item) => item.status === "REJECTED" || item.status === "SUSPENDED",
      );
    if (activeTab === "Pending Approval")
      result = result.filter((item) => item.status === "PENDING");

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.businessName?.toLowerCase().includes(q) ||
          item.email?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [rows, activeTab, searchQuery]);

  const handleAction = async (id, actionType) => {
    try {
      setActionLoading(true);
      const type = actionType.toLowerCase();
      if (type === "approve" || type === "active") await approveUser(id);
      else if (type === "reject" || type === "suspended" || type === "rejected")
        await rejectUser(id);
      await loadBrands();
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PageWrapper
      title="Brand Management"
      subtitle="Review and manage brand partnerships"
    >
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-1.5 shadow-sm border border-[#E8DED5]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-leather text-white shadow-md shadow-leather/20"
                    : "text-[#6A5B54] hover:bg-atmosphere hover:text-leather"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-gold" : "text-[#A39289]"}`}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative group max-w-sm w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A39289] group-focus-within:text-leather transition-colors" />
          <input
            type="text"
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E8DED5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-leather/10 focus:border-leather transition-all"
          />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl shadow-ink/5">
        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <Spinner size="lg" color="leather" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              headers={[
                "Business Details",
                "Product Category",
                "Contact",
                "Status",
                "Joined Date",
                "Actions",
              ]}
            >
              {filteredRows.length > 0 ? (
                filteredRows.map((brand) => (
                  <BrandRow
                    key={brand.id || brand._id}
                    brand={brand}
                    onAction={handleAction}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-32 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-atmosphere rounded-full flex items-center justify-center mb-2">
                        <Users className="w-8 h-8 text-[#D7CBC1]" />
                      </div>
                      <h3 className="text-lg font-bold text-ink">
                        No brands found
                      </h3>
                      <p className="text-sm text-[#A39289]">
                        Try adjusting your search or filters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </Table>
          </div>
        )}

        {actionLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
            <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
              <Spinner size="md" color="leather" />
              <p className="text-xs font-bold text-ink uppercase tracking-widest">
                Updating Status
              </p>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
