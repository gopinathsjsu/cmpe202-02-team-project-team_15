import * as dotenv from "dotenv";
import mongoose from "mongoose";
import { app } from "./app";
import path from "path";

import http from "http";
import { initSocket } from "./utils/socket";

// Load environment variables

dotenv.config({ path: path.resolve(__dirname, ".env") });
const PORT = parseInt(process.env.PORT || '5000', 10);

// Connect to MongoDB
const connectDatabase = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost/campus-market"
    );
    console.log(
      "✅ Connected to MongoDB:",
      process.env.MONGO_URI || "mongodb://localhost/campus-market"
    );

    console.log("Database is connected!");
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
};

connectDatabase();

const server = http.createServer(app);
initSocket(server);
// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server accessible at http://0.0.0.0:${PORT}`);
  console.log(`Client: http://localhost:3000`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});
