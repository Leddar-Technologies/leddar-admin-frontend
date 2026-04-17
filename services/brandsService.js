import axios from "axios";
import { getSession } from "./authService";

// Ensure the URL doesn't end with a slash to prevent double slashes in paths
const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"
).replace(/\/$/, "");

/**
 * Helper to generate Authorization headers
 */
const getAuthHeaders = () => {
  const session = getSession();
  return {
    headers: {
      Authorization: `Bearer ${session?.token}`,
      "Content-Type": "application/json",
    },
  };
};

/**
 * Fetch users based on status
 * Matches route: GET /api/v1/admin/users?status=...
 */
export async function getBrands(tabStatus = "All") {
  try {
    // Exact mapping between Frontend Tab Labels and Backend Prisma Statuses
    const statusMap = {
      All: "ALL",
      "Pending Approval": "PENDING",
      Verified: "APPROVED", // Prisma status is APPROVED
      Suspended: "REJECTED", // Prisma status is REJECTED
    };

    const backendStatus = statusMap[tabStatus] || "ALL";

    const response = await axios.get(
      `${BASE_URL}/admin/users?status=${backendStatus}`,
      getAuthHeaders(),
    );

    const rawData = response.data.data;

    if (Array.isArray(rawData)) {
      return rawData.map((user) => ({
        id: user.id,
        email: user.email,
        status: user.status, // Matches: "APPROVED", "REJECTED", or "PENDING"
        role: user.role,
        businessName: user.brand?.businessName || "No Name",
        productType: user.brand?.productType || "N/A",
        whatsapp: user.brand?.whatsappNumber || "N/A",
        registrationDate: user.createdAt
          ? new Date(user.createdAt).toLocaleDateString()
          : "N/A",

        // This 'kycStatus' string must match what your 'BrandRow' or filters expect
        kycStatus:
          user.status === "APPROVED"
            ? "Verified"
            : user.status === "PENDING"
              ? "Pending"
              : "Suspended",
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

/**
 * Approve a user
 * Matches route: PATCH /api/v1/admin/approve/:userId
 */
export async function approveUser(userId) {
  try {
    const response = await axios.patch(
      `${BASE_URL}/admin/approve/${userId}`,
      {},
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error(`Error approving user ${userId}:`, error);
    throw error.response?.data?.message || "Failed to approve user";
  }
}

/**
 * Reject a user
 * Matches route: PATCH /api/v1/admin/reject/:userId
 */
export async function rejectUser(userId) {
  try {
    const response = await axios.patch(
      `${BASE_URL}/admin/reject/${userId}`,
      {},
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error(`Error rejecting user ${userId}:`, error);
    throw error.response?.data?.message || "Failed to reject user";
  }
}

/**
 * Get current admin info
 */
export async function getAdminMe() {
  try {
    const response = await axios.get(`${BASE_URL}/admin/me`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return null;
  }
}
