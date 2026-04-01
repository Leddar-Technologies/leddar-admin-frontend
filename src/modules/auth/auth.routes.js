import { Router } from "express";
import {
  registerBrand,
  registerArtisan,
  login,
} from "../modules/auth/auth.controller.js";

const router = Router();

router.post("/register/brand", registerBrand);
router.post("/register/artisan", registerArtisan);
router.post("/login", login);

export default router;
