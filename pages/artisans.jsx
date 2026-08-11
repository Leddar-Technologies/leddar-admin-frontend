"use client";

import { useEffect, useMemo, useState } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import Table from "@/components/ui/Table";
import ArtisanRow from "@/components/admin/ArtisanRow";
import Spinner from "@/components/ui/Spinner";
import FilterDropdown from "@/components/ui/FilterDropdown";
import {
  getArtisans,
  approveArtisan,
  rejectArtisan,
} from "@/services/artisansService";
import { Users, ShieldCheck, Clock, UserX, Search, FileSearch } from "lucide-react";
import { toast } from "react-hot-toast";

const tabs = [
  { id: "All",              label: "All Artisans", icon: Users },
  { id: "Pending Approval", label: "Pending",      icon: Clock },
  { id: "Verified",         label: "Verified",     icon: ShieldCheck },
  { id: "KYC Pending",      label: "KYC Pending",  icon: FileSearch },
  { id: "KYC Verified",     label: "KYC Verified", icon: ShieldCheck },
  { id: "Suspended",        label: "Suspended",    icon: UserX },
];

export default function ArtisansPage() {
  const [activeTab, setActiveTab]           = useState("All");
  const [rows, setRows]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [actionLoading, setActionLoading]   = useState(false);
  const [actionError, setActionError]       = useState("");
  const [searchQuery, setSearchQuery]       = useState("");
  const [emailFilter, setEmailFilter]       = useState("All");
  const [producesForFilter, setProducesForFilter] = useState("All");

  const loadArtisans = async () => {
    try {
      setLoading(true);
      const data = await getArtisans("All");
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch artisans:", err);
      toast.error("Failed to load artisans");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtisans();
  }, []);

  const filteredRows = useMemo(() => {
    let result = [...rows];

    if (activeTab === "Pending Approval")
      result = result.filter((r) => r.status === "PENDING");
    if (activeTab === "Verified")
      result = result.filter((r) => r.status === "APPROVED");
    if (activeTab === "KYC Pending")
      result = result.filter(
        (r) => r.kycStatus === "PENDING" || !r.kycStatus || r.kycStatus === "NOT_STARTED",
      );
    if (activeTab === "KYC Verified")
      result = result.filter((r) => r.kycStatus === "VERIFIED");
    if (activeTab === "Suspended")
      result = result.filter((r) => r.status === "REJECTED");

    if (emailFilter === "Verified")
      result = result.filter((r) => r.emailVerified);
    if (emailFilter === "Unverified")
      result = result.filter((r) => !r.emailVerified);

    if (producesForFilter !== "All")
      result = result.filter((r) => r.producesFor === producesForFilter);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.fullName?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          (Array.isArray(r.specialty)
            ? r.specialty.join(" ").toLowerCase().includes(q)
            : r.specialty?.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [rows, activeTab, searchQuery, emailFilter, producesForFilter]);

  const handleAction = async (id, actionType) => {
    try {
      setActionLoading(true);
      setActionError("");
      const type = actionType.toLowerCase();
      if (type === "approve") {
        await approveArtisan(id);
        toast.success("Artisan approved");
      } else if (type === "reject") {
        await rejectArtisan(id);
        toast.success("Artisan suspended");
      }
      await loadArtisans();
    } catch (err) {
      console.error("Action failed:", err);
      const message = err.response?.data?.message || "Operation failed. Please try again.";
      setActionError(message);
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PageWrapper
      title="Artisan Management"
      subtitle="Verify credentials and manage specialized artisan profiles"
    >
      {actionError && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {actionError}
        </div>
      )}

      {/* Tabs + Search */}
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
                <Icon className={`h-4 w-4 ${isActive ? "text-gold" : "text-[#A39289]"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <FilterDropdown
            className="w-48"
            value={emailFilter}
            onChange={setEmailFilter}
            options={[
              { value: "All", label: "All Emails" },
              { value: "Verified", label: "Email Verified" },
              { value: "Unverified", label: "Email Unverified" },
            ]}
          />

          <FilterDropdown
            className="w-48"
            value={producesForFilter}
            onChange={setProducesForFilter}
            options={[
              { value: "All", label: "Produces For: All" },
              { value: "MALE", label: "Male Wear" },
              { value: "FEMALE", label: "Female Wear" },
              { value: "UNISEX", label: "Unisex / Both" },
            ]}
          />

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
      </div>

      {/* Table */}
      <div className="relative overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl shadow-ink/5">
        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <Spinner size="lg" color="leather" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              headers={[
                "Artisan Details",
                "Specialty",
                "Contact",
                "Status",
                "Email Verified",
                "Joined Date",
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
                        <Users className="w-8 h-8 text-[#D7CBC1]" />
                      </div>
                      <h3 className="text-lg font-bold text-ink">No artisans found</h3>
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
