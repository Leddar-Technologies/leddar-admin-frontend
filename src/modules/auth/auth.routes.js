import express from "express";
import * as controller from "./auth.controller.js";

const router = express.Router();

router.post("/register/brand", controller.registerBrand);
router.post("/register/artisan", controller.registerArtisan);
router.get("/verify-email", controller.verifyEmail);
router.post("/login", controller.login);

export default router;
