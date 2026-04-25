import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { login } from "../../services/authService";

/**
 * Async thunk to handle Admin Login
 * credentials: { email, password }
 */
export const loginAdmin = createAsyncThunk(
  "adminAuth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await login(credentials);

      // Role Guard: Ensure the user is actually an ADMIN
      if (data.role !== "ADMIN") {
        throw new Error("Access Denied: Admin privileges required.");
      }

      return data;
    } catch (err) {
      return rejectWithValue(err.message || "An unexpected error occurred");
    }
  },
);

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState: {
    admin:
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("admin"))
        : null,
    loading: false,
    error: null,
  },
  reducers: {
    logoutAdmin: (state) => {
      state.admin = null;
      state.error = null;
      state.loading = false;
      // 🔥 Clear storage on logout
      localStorage.removeItem("token");
      localStorage.removeItem("admin");
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.admin = action.payload;
        state.error = null;

        // 🔥 Persist the token and admin data
        // Ensure your API returns the token inside the data object
        if (action.payload.token) {
          localStorage.setItem("token", action.payload.token);
          localStorage.setItem("admin", JSON.stringify(action.payload));
        }
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.admin = null;
      });
  },
});

export const { logoutAdmin, clearAuthError } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
