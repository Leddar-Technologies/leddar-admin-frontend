import { configureStore } from "@reduxjs/toolkit";
import adminAuthReducer from "./slices/adminAuthSlice";

export const store = configureStore({
  reducer: {
    adminAuth: adminAuthReducer,
    // You can add admin-specific slices here later (e.g., brandManagement, artisanApproval)
  },
});
