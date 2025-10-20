// ✅ Express app setup split from server entry
import express = require("express");
import { Router } from "express";

// Import routes with CJS/ESM compatibility
const listingsRoute: Router = (require("./routes/listings").default || require("./routes/listings")) as Router;

const app: express.Application = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/listings", listingsRoute);

export default app;


