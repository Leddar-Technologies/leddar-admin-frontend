import authRoutes from "./auth.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";

router.use("/auth", authRoutes);
app.use("/api/admin", adminRoutes);
