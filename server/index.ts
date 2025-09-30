import http from "http";
import mongoose from "mongoose";
import { app } from "./app";
import { initSocket } from "./utils/socket";

(async function main() {
  await mongoose.connect(process.env.MONGO_URI!);
  const server = http.createServer(app);
  initSocket(server);
  const port = Number(process.env.PORT) || 8080;
  server.listen(port, () => console.log(`Campus Marketplace up on ${port}`));
})();
