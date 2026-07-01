// leddar-admin-frontend/services/authService.js

const ADMIN_SESSION_KEY   = "leddar_admin_session";
const API_URL             = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// ---------------------------------------------------------------------------
// Login — stores BOTH access token and refresh token
// ---------------------------------------------------------------------------
export async function login({ email, password, role }) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email, password, role }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Login failed");
  }

  if (result.success && result.data.token) {
    localStorage.setItem(
      ADMIN_SESSION_KEY,
      JSON.stringify({
        token:        result.data.token,
        refreshToken: result.data.refreshToken || null,
        email:        result.data.user.email,
        role:         result.data.user.role,
      }),
    );
    return result.data.user;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Token refresh
// Calls POST /auth/refresh with the stored refresh token.
// On success, updates localStorage with the new tokens and returns the new
// access token string. On failure, logs the user out.
// ---------------------------------------------------------------------------
let _refreshPromise = null; // ensures only one concurrent refresh call

export async function refreshAccessToken() {
  // De-duplicate concurrent refreshes
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const session = getSession();
      if (!session?.refreshToken) {
        logout();
        return null;
      }

      const res = await fetch(`${API_URL}/auth/refresh`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ refreshToken: session.refreshToken }),
      });

      const result = await res.json();

      if (!res.ok || !result.data?.token) {
        // Refresh token is expired or invalid — force logout
        logout();
        return null;
      }

      // Persist new tokens
      localStorage.setItem(
        ADMIN_SESSION_KEY,
        JSON.stringify({
          ...session,
          token:        result.data.token,
          refreshToken: result.data.refreshToken || session.refreshToken,
        }),
      );

      return result.data.token;
    } catch {
      logout();
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}
