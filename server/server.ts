import * as dotenv from "dotenv"; // For ES modules

// CRITICAL: Load environment variables FIRST before any other imports
dotenv.config();

// Now import everything else AFTER env vars are loaded
import http from "http";
import mongoose from "mongoose";
import { app } from "./app";
import { initSocket } from "./utils/socket";

(async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("Database is connected!");
  } catch (err) {
    console.error("Database connection error:", err);
  }
  const server = http.createServer(app);
  initSocket(server);
  const port = Number(process.env.PORT) || 8080;
  server.listen(port, () => console.log(`Campus Marketplace up on ${port}`));
})();
