import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  createReport,
  getUserReports,
  getReport,
} from "../handlers/report";

export const reportRouter = Router();

// All report routes require authentication
reportRouter.use(authenticateToken);

// POST /api/reports - Create a new report
reportRouter.post("/", createReport);

// GET /api/reports - Get current user's reports
reportRouter.get("/", getUserReports);

// GET /api/reports/:reportId - Get a specific report
reportRouter.get("/:reportId", getReport);
