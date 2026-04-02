// Server listener (Entry Point)
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 5000;

console.log(process.env.DATABASE_URL);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});