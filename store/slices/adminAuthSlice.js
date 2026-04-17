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
      // Call the named export from authService
      const data = await login(credentials);

      // Role Guard: Ensure the user is actually an ADMIN
      if (data.role !== "ADMIN") {
        throw new Error("Access Denied: Admin privileges required.");
      }

      return data;
    } catch (err) {
      // Passes the error message to action.payload in the rejected case
      return rejectWithValue(err.message || "An unexpected error occurred");
    }
  },
);

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState: {
    admin: null,
    loading: false,
    error: null,
  },
  reducers: {
    // Call this to manually clear the admin state (logout)
    logoutAdmin: (state) => {
      state.admin = null;
      state.error = null;
      state.loading = false;
    },
    // Useful for clearing errors when the user starts typing again
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle Loading State
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Handle Success State
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.admin = action.payload; // This is the user object from the API
        state.error = null;
      })
      // Handle Error State
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // This is the error message from rejectWithValue
        state.admin = null;
      });
  },
});

export const { logoutAdmin, clearAuthError } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
