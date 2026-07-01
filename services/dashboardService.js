import apiClient from "./apiClient";

export async function getDashboardStats() {
  const res = await apiClient.get("/admin/stats");
  return res.data.data;
}
