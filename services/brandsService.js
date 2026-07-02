import apiClient from "./apiClient";

const statusMap = {
  All:               "ALL",
  "Pending Approval": "PENDING",
  Verified:          "APPROVED",
  Suspended:         "REJECTED",
};

export async function getBrands(tabStatus = "All") {
  try {
    const backendStatus = statusMap[tabStatus] || "ALL";
    const res = await apiClient.get(`/admin/users?status=${backendStatus}`);
    const rawData = res.data.data;
    if (!Array.isArray(rawData)) return [];
    return rawData.map((user) => ({
      id:               user.id,
      email:            user.email,
      status:           user.status,
      role:             user.role,
      businessName:     user.brand?.businessName || "No Name",
      productType:      user.brand?.productType || "N/A",
      whatsapp:         user.brand?.whatsappNumber || "N/A",
      registrationDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A",
      kycStatus:        user.kyc?.status || "NOT_STARTED",
      emailVerified:    !!user.emailVerified,
    }));
  } catch (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
}

export async function approveUser(userId) {
  const res = await apiClient.patch(`/admin/approve/${userId}`, {});
  return res.data;
}

export async function rejectUser(userId) {
  const res = await apiClient.patch(`/admin/reject/${userId}`, {});
  return res.data;
}

export async function getAdminMe() {
  try {
    const res = await apiClient.get("/admin/me");
    return res.data;
  } catch {
    return null;
  }
}

export const getBrandById = async (id) => {
  const res = await apiClient.get(`/admin/get-brand/${id}`);
  return res.data.data;
};
