"use client";

import { useEffect, useMemo, useState } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import Table from "@/components/ui/Table";
import ArtisanRow from "@/components/admin/ArtisanRow";
import Spinner from "@/components/ui/Spinner";
import { getArtisans, updateArtisanStatus } from "@/services/artisansService";
import { Users, ShieldCheck, Clock, UserX, Search, Hammer } from "lucide-react";

const tabs = [
  { id: "All", label: "All Artisans", icon: Users },
  { id: "Pending Approval", label: "Pending", icon: Clock },
  { id: "Verified", label: "Verified", icon: ShieldCheck },
  { id: "Suspended", label: "Suspended", icon: UserX },
];

export default function ArtisansPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadArtisans = async () => {
    try {
      setLoading(true);
      const data = await getArtisans();
      // Filter for Artisan role safety
      const artisanData = Array.isArray(data)
        ? data.filter((user) => user.role === "ARTISAN")
        : [];
      setRows(artisanData);
    } catch (err) {
      console.error("Failed to fetch artisans:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtisans();
  }, []);

  const filteredRows = useMemo(() => {
    let result = rows;

    // Tab Filtering
    if (activeTab === "Verified") {
      result = rows.filter(
        (item) => item.kycStatus === "Verified" || item.status === "APPROVED",
      );
    } else if (activeTab === "Suspended") {
      result = rows.filter(
        (item) => item.status === "Suspended" || item.status === "REJECTED",
      );
    } else if (activeTab === "Pending Approval") {
      result = rows.filter(
        (item) =>
          item.status === "Pending Approval" || item.status === "PENDING",
      );
    }

    // Search filter (Name or Specialty)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.fullName?.toLowerCase().includes(query) ||
          item.specialty?.toLowerCase().includes(query) ||
          item.email?.toLowerCase().includes(query),
      );
    }

    return result;
  }, [rows, activeTab, searchQuery]);

  const handleAction = async (id, status) => {
    try {
      setActionLoading(true);
      await updateArtisanStatus(id, status);
      await loadArtisans();
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PageWrapper
      title="Artisan Management"
      subtitle="Verify credentials and manage specialized artisan profiles"
    >
      {/* Search & Tabs Header */}
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

        {/* Search Bar */}
        <div className="relative group max-w-sm w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A39289] group-focus-within:text-leather transition-colors" />
          <input
            type="text"
            placeholder="Search by name or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E8DED5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-leather/10 focus:border-leather transition-all"
          />
        </div>
      </div>

      {/* Mini Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-xs font-bold uppercase tracking-widest text-[#A39289]">
        <div className="bg-white p-4 rounded-2xl border border-[#E8DED5] flex flex-col gap-1">
          <span>Active Artisans</span>
          <span className="text-xl text-ink">
            {
              rows.filter(
                (r) => r.status === "APPROVED" || r.kycStatus === "Verified",
              ).length
            }
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E8DED5] flex flex-col gap-1">
          <span>Displayed Results</span>
          <span className="text-xl text-leather">{filteredRows.length}</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="relative overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl shadow-ink/5">
        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <Spinner size="lg" color="leather" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              headers={[
                "Full Name",
                "Specialty",
                "WhatsApp",
                "KYC Status",
                "Portfolio",
                "Registration Date",
                "Actions",
              ]}
            >
              {filteredRows.length > 0 ? (
                filteredRows.map((artisan) => (
                  <ArtisanRow
                    key={artisan.id}
                    artisan={artisan}
                    onAction={handleAction}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-32 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-atmosphere rounded-full flex items-center justify-center mb-2">
                        <Hammer className="w-8 h-8 text-[#D7CBC1]" />
                      </div>
                      <h3 className="text-lg font-bold text-ink">
                        No artisans found
                      </h3>
                      <p className="text-sm text-[#A39289] max-w-[240px]">
                        We couldn't find any artisans matching your criteria in
                        the <strong>{activeTab}</strong> category.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </Table>
          </div>
        )}

        {/* Action Loading Overlay */}
        {actionLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[2px] transition-all">
            <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
              <Spinner size="md" color="leather" />
              <p className="text-xs font-bold text-ink uppercase tracking-widest">
                Processing Request
              </p>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
