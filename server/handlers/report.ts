import { Request, Response } from "express";
import { Report } from "../models/Report";
import Listing from "../models/Listing";

// Create a new report
export const createReport = async (req: any, res: Response) => {
  try {
    const { listingId, reportCategory, details } = req.body;
    const reporterId = req.user._id;

    // Validate required fields
    if (!listingId || !reportCategory) {
      return res.status(400).json({
        success: false,
        message: "listingId and reportCategory are required",
      });
    }

    // Validate report category
    const validCategories = [
      "FRAUD",
      "SCAM_COUNTERFEIT",
      "MISLEADING_WRONG_CATEGORY",
      "INAPPROPRIATE_PROHIBITED_SAFETY",
      "OTHER",
    ];
    if (!validCategories.includes(reportCategory)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report category",
      });
    }

    // Validate details length
    if (details && details.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Details must be 500 characters or less",
      });
    }

    // Find the listing to get sellerId
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    // Check if user is trying to report their own listing
    if (String(listing.userId) === String(reporterId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot report your own listing",
      });
    }

    // Check if user has already reported this listing
    const existingReport = await Report.findOne({
      listingId,
      reporterId,
    });

    if (existingReport) {
      return res.status(409).json({
        success: false,
        message: "You have already reported this listing",
        reportId: existingReport._id,
        status: existingReport.status,
      });
    }

    // Create the report
    const report = new Report({
      listingId,
      sellerId: listing.userId,
      reporterId,
      reportCategory,
      details: details?.trim() || undefined,
      status: "OPEN",
    });

    await report.save();

    // Populate the report with user and listing details for response
    await report.populate([
      { path: "listingId", select: "title price" },
      { path: "sellerId", select: "first_name last_name email" },
      { path: "reporterId", select: "first_name last_name email" },
    ]);

    return res.status(201).json({
      success: true,
      message: "Report created successfully",
      report: {
        _id: report._id,
        listingId: report.listingId,
        sellerId: report.sellerId,
        reporterId: report.reporterId,
        reportCategory: report.reportCategory,
        details: report.details,
        status: report.status,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get reports for the current user (reports they made)
export const getUserReports = async (req: any, res: Response) => {
  try {
    const reporterId = req.user._id;
    const { status, limit = 20, page = 1 } = req.query;

    // Build query
    const query: any = { reporterId };
    if (status && ["OPEN", "IN_REVIEW", "CLOSED"].includes(status)) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Get reports with pagination
    const reports = await Report.find(query)
      .populate([
        { path: "listingId", select: "title price images" },
        { path: "sellerId", select: "first_name last_name" },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    // Get total count for pagination
    const totalReports = await Report.countDocuments(query);

    return res.json({
      success: true,
      reports,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(totalReports / parseInt(limit as string)),
        totalReports,
        hasNext: skip + reports.length < totalReports,
        hasPrev: parseInt(page as string) > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching user reports:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get a specific report by ID
export const getReport = async (req: any, res: Response) => {
  try {
    const { reportId } = req.params;
    const userId = req.user._id;

    const report = await Report.findById(reportId).populate([
      { path: "listingId", select: "title price images sellerId" },
      { path: "sellerId", select: "first_name last_name email" },
      { path: "reporterId", select: "first_name last_name email" },
    ]);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Check if user is the reporter or the seller (for now, only reporter can view)
    if (String(report.reporterId._id) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own reports",
      });
    }

    return res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
