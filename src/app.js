import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";

const app = express();

app.use(express.json());

// CORS setup
app.use(
  cors({
    origin: [
      "http://localhost:3000", // admin
      "http://localhost:3004", // brand
      "http://localhost:3005", // artisan
    ],
    credentials: true, // if you're using cookies or auth headers
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

export default app;
