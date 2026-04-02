import express from "express";
import * as controller from "./admin.controller.js";
import { protect, isAdmin } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/pending", protect, isAdmin, controller.getPendingUsers);
router.patch("/approve/:userId", protect, isAdmin, controller.approveUser);
router.patch("/reject/:userId", protect, isAdmin, controller.rejectUser);

export default router;
