// ✅ Use CommonJS imports since module = commonjs
import express = require("express");
import dotenv = require("dotenv");
import { Router } from "express";
dotenv.config();

// Explicitly type the imported route
const listingsRoute: Router = require("./routes/listings").default || require("./routes/listings");


const app: express.Application = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/listings", listingsRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
