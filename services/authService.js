// leddar-admin-frontend/services/authService.js

const ADMIN_SESSION_KEY = "leddar_admin_session";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function login({ email, password, role }) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Login failed");
  }

  if (result.success && result.data.token) {
    localStorage.setItem(
      ADMIN_SESSION_KEY,
      JSON.stringify({
        token: result.data.token,
        email: result.data.user.email,
        role: result.data.user.role,
      }),
    );
    return result.data.user;
  }
  return null;
}

export function getSession() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw || raw === "null" || raw === "undefined") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    window.location.href = "/login";
  }
}
