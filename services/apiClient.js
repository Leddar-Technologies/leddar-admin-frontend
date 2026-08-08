// leddar-admin-frontend/services/apiClient.js
// Shared axios instance with automatic token refresh on 401.

import axios from "axios";
import { getSession, refreshAccessToken, logout } from "./authService";

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.myleddar.com/api/v1"
).replace(/\/$/, "");

const apiClient = axios.create({ baseURL: BASE_URL });

// ---------------------------------------------------------------------------
// Request interceptor — attach current access token to every request
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use((config) => {
  const session = getSession();
  if (session?.token) {
    config.headers["Authorization"] = `Bearer ${session.token}`;
  }
  config.headers["Content-Type"] = config.headers["Content-Type"] || "application/json";
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — on 401 try to refresh once, then retry
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only retry once (_retry flag prevents infinite loops)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const newToken = await refreshAccessToken();
      if (!newToken) {
        // refreshAccessToken already called logout()
        return Promise.reject(error);
      }

      // Swap in the fresh token and retry
      originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
