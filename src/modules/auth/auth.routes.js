import express from "express";
import { upload } from "../../middleware/upload.js";
import * as controller from "./auth.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register/brand", controller.registerBrand);
router.post(
  "/register/artisan",
  upload.array("portfolio", 4),
  controller.registerArtisan,
);
router.get("/verify-email", controller.verifyEmail);
router.post("/login", controller.login);

router.get("/me", protect, controller.getMe);

export default router;
