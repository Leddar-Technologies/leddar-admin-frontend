import { dashboardStats, recentActivities } from '@/data/mockData';

export async function getDashboardStats() {
  return { ...dashboardStats };
}

export async function getRecentActivities() {
  return recentActivities.map((item) => ({ ...item }));
}
