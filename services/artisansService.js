import axios from "axios";
import { getSession } from "./authService";

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"
).replace(/\/$/, "");

const getAuthHeaders = () => {
  const session = getSession();
  return {
    headers: {
      Authorization: `Bearer ${session?.token}`,
      "Content-Type": "application/json",
    },
  };
};

export async function getArtisans(tabStatus = "All") {
  try {
    const statusMap = {
      All: "ALL",
      "Pending Approval": "PENDING",
      Verified: "APPROVED",
      Suspended: "REJECTED",
    };

    const backendStatus = statusMap[tabStatus] || "ALL";

    const response = await axios.get(
      `${BASE_URL}/admin/users?status=${backendStatus}`,
      getAuthHeaders(),
    );

    const rawData = response.data.data;

    if (Array.isArray(rawData)) {
      return rawData
        .filter((user) => user.role === "ARTISAN")
        .map((user) => ({
          id: user.id,
          email: user.email,
          status: user.status,
          role: user.role,
          fullName: user.artisan?.fullName || "Unknown",
          specialty: user.artisan?.specialty || "N/A",
          whatsapp: user.artisan?.whatsappNumber || "N/A",
          location: user.artisan?.city
            ? `${user.artisan.city}${user.artisan.state ? ", " + user.artisan.state : ""}`
            : "N/A",
          registrationDate: user.createdAt
            ? new Date(user.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "N/A",
          kycStatus:
            user.status === "APPROVED"
              ? "Verified"
              : user.status === "PENDING"
                ? "Pending"
                : "Suspended",
          portfolio: user.artisan?.portfolio || [],
        }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching artisans:", error);
    throw error;
  }
}

export async function approveArtisan(id) {
  try {
    const response = await axios.patch(
      `${BASE_URL}/admin/approve/${id}`,
      {},
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error(`Error approving artisan ${id}:`, error);
    throw error.response?.data?.message || "Failed to approve artisan";
  }
}

export async function rejectArtisan(id) {
  try {
    const response = await axios.patch(
      `${BASE_URL}/admin/reject/${id}`,
      {},
      getAuthHeaders(),
    );
    return response.data;
  } catch (error) {
    console.error(`Error rejecting artisan ${id}:`, error);
    throw error.response?.data?.message || "Failed to reject artisan";
  }
}
