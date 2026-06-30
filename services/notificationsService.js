// leddar-admin-frontend/services/notificationsService.js
import apiClient from "./apiClient";

export async function getNotifications() {
  try {
    const res = await apiClient.get("/admin/notifications");
    return res.data.data || [];
  } catch {
    return [];
  }
}

// Kept for backwards compatibility
export async function createNotification(payload) {
  return { id: Date.now(), ...payload };
}
