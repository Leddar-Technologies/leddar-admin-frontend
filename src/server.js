// Server listener (Entry Point)
import dotenv from "dotenv";
dotenv.config();
import listEndpoints from "express-list-endpoints";

import app from "./app.js";

const PORT = process.env.PORT || 5000;

console.log(process.env.DATABASE_URL);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  setTimeout(() => {
    const routes = listEndpoints(app);

    console.log("📌 Available Routes:");

    routes.forEach((route) => {
      route.methods.forEach((method) => {
        console.log(`${method.padEnd(6)} ${route.path}`);
      });
    });
  }, 100); // 🔥 important
});