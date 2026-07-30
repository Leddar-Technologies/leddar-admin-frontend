import apiClient from "./apiClient";

export async function getArtisanById(id) {
  try {
    const res = await apiClient.get(`/admin/get-artisan/${id}`);
    const data = res.data.data;
    return {
      id:               data.id,
      userId:           data.userId,
      fullName:         data.fullName || "Unknown",
      email:            data.email || "N/A",
      whatsapp:         data.whatsapp || "N/A",
      specialty:        Array.isArray(data.specialty) ? data.specialty : data.specialty ? [data.specialty] : [],
      producesFor:      data.producesFor || null,
      city:             data.city || "",
      state:            data.state || "",
      status:           data.status || "PENDING",
      kycStatus:        data.kycStatus || "NOT_STARTED",
      registrationDate: data.registrationDate || data.createdAt,
      portfolio:        data.portfolio || [],
      jobs:             data.jobs || [],
      payments:         data.payments || [],
      bankDetail:       data.bankDetail || null,
      address:          data.address || null,
    };
  } catch (error) {
    console.error(`Error fetching artisan profile ${id}:`, error);
    throw error;
  }
}

export async function getArtisans(tabStatus = "All") {
  try {
    const statusMap = {
      All: "ALL", "Pending Approval": "PENDING", Verified: "APPROVED", Suspended: "REJECTED",
    };
    const res = await apiClient.get(`/admin/users?status=${statusMap[tabStatus] || "ALL"}`);
    const rawData = res.data.data;
    if (!Array.isArray(rawData)) return [];
    return rawData
      .filter((user) => user.role === "ARTISAN")
      .map((user) => ({
        id:               user.artisan?.id || user.id,
        userId:           user.id,
        email:            user.email,
        status:           user.status,
        role:             user.role,
        fullName:         user.artisan?.fullName || "Unknown",
        specialty:        Array.isArray(user.artisan?.specialty) ? user.artisan.specialty : user.artisan?.specialty ? [user.artisan.specialty] : [],
        producesFor:      user.artisan?.producesFor || null,
        whatsapp:         user.artisan?.whatsapp || "N/A",
        location:         user.artisan?.city
          ? `${user.artisan.city}${user.artisan.state ? ", " + user.artisan.state : ""}`
          : "N/A",
        registrationDate: user.createdAt
          ? new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
          : "N/A",
        kycStatus:      user.kyc?.status        || "NOT_STARTED",
        ninStatus:      user.kyc?.ninStatus     || null,
        addressStatus:  user.kyc?.addressStatus || null,
        addressVerifiedAt: user.kyc?.addressVerifiedAt || null,
        ninVerifiedAt:  user.kyc?.ninVerifiedAt || null,
        portfolio: user.artisan?.portfolio || [],
        emailVerified:  !!user.emailVerified,
      }));
  } catch (error) {
    console.error("Error fetching artisans:", error);
    throw error;
  }
}

export async function approveArtisan(id) {
  const res = await apiClient.patch(`/admin/approve/${id}`, {});
  return res.data;
}

export async function rejectArtisan(id) {
  const res = await apiClient.patch(`/admin/reject/${id}`, {});
  return res.data;
}

// Manual fallback for an address check stuck at IN_PROGRESS — pulls the current
// result straight from QoreID instead of waiting on a webhook that may never arrive.
export async function resyncAddressVerification(artisanId) {
  const res = await apiClient.post(`/admin/artisans/${artisanId}/address/resync`, {});
  return res.data;
}
