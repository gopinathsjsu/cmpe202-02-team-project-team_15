import express, { Application } from "express";
import dotenv from "dotenv";
import listingsRoute from "./routes/listings";

dotenv.config();

const app: Application = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/listings", listingsRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
