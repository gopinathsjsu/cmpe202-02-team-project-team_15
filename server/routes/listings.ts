import { Router } from "express";
import { createListing, markAsSold, getListings, deleteListing } from "../handlers/listingController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/", authenticateToken, createListing);
router.patch("/:id/sold", authenticateToken, markAsSold);
router.get("/", getListings);
router.delete("/:id", authenticateToken, deleteListing);

export default router;
