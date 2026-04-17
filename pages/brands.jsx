import { useEffect, useMemo, useState } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import Table from "@/components/ui/Table";
import BrandRow from "@/components/admin/BrandRow";
import Spinner from "@/components/ui/Spinner";
import { getBrands, approveUser, rejectUser } from "@/services/brandsService";

const tabs = ["All", "Pending Approval", "Verified", "Suspended"];

export default function BrandsPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Updated to fetch data based on the active tab
  const loadBrands = async () => {
    try {
      setLoading(true);
      // We pass the activeTab to the service so it hits the correct API query
      const data = await getBrands(activeTab);

      // Filter for BRANDS only (if your API returns both)
      const brandOnlyData = Array.isArray(data)
        ? data.filter((user) => user.role === "BRAND")
        : [];

      setRows(brandOnlyData);
    } catch (err) {
      console.error("Failed to fetch brands:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // Re-run whenever activeTab changes
  useEffect(() => {
    loadBrands();
  }, [activeTab]);

  const filteredRows = useMemo(() => {
    if (!rows || !Array.isArray(rows)) return [];

    // Since the API is now handling the filtering via the 'status' query,
    // we mostly just return the rows. However, we keep these checks
    // to ensure the UI is strictly consistent with the tab.
    if (activeTab === "All") return rows;

    if (activeTab === "Verified")
      return rows.filter((item) => item.status === "APPROVED");

    if (activeTab === "Suspended")
      return rows.filter((item) => item.status === "REJECTED");

    if (activeTab === "Pending Approval")
      return rows.filter((item) => item.status === "PENDING");

    return rows;
  }, [rows, activeTab]);

  const handleAction = async (id, actionType) => {
    try {
      setActionLoading(true);

      const type = actionType.toLowerCase();
      if (type === "approve" || type === "active") {
        await approveUser(id);
      } else if (type === "reject" || type === "suspended") {
        await rejectUser(id);
      }

      // Refresh data to move the item to its new tab
      await loadBrands();
    } catch (err) {
      alert(err || "An error occurred while updating the user status.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PageWrapper title="Brand Management">
      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === tab
                ? "bg-[#6B3A2A] text-white shadow-md"
                : "bg-white text-[#A39289] border border-[#E8DED5] hover:bg-[#FCF9F7]"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table Section */}
      <div className="relative overflow-hidden rounded-2xl border border-[#E8DED5] bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <Table
            headers={[
              "Business Name",
              "Product Type",
              "WhatsApp",
              "Status",
              "Registration Date",
              "Actions",
            ]}
          >
            {filteredRows.length > 0 ? (
              filteredRows.map((brand) => (
                <BrandRow
                  key={brand.id}
                  brand={brand}
                  onAction={handleAction}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="py-20 text-center text-sm text-[#A39289]"
                >
                  No {activeTab.toLowerCase()} brands found.
                </td>
              </tr>
            )}
          </Table>
        )}

        {/* Action Loading Overlay */}
        {actionLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
            <Spinner size="md" />
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
