import express from "express";
import * as controller from "./admin.controller.js";
import { protect, isAdmin, } from "../../middleware/auth.middleware.js";

const router = express.Router();

// router.get("/pending", protect, isAdmin, controller.getPendingUsers);
router.get(
  "/pending",
  (req, res, next) => {
    console.log("✅ ADMIN ROUTE HIT");
    next();
  },
  protect,
  isAdmin,
  controller.getPendingUsers,
);
router.patch("/approve/:userId", protect, isAdmin, controller.approveUser);
router.patch("/reject/:userId", protect, isAdmin, controller.rejectUser);
router.get("/me", protect, isAdmin, controller.getMe);

export default router;
