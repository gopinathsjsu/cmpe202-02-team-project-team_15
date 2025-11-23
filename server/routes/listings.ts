import { Router } from "express";
import { createListing, markAsSold, getListings, getMyListings, updateListing, deleteListing, getListingsByUserId } from "../handlers/listingController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/", authenticateToken, createListing);
router.put("/:id", authenticateToken, updateListing);
router.patch("/:id/sold", authenticateToken, markAsSold);
router.get("/my-listings", authenticateToken, getMyListings);
router.get("/user/:userId", authenticateToken, getListingsByUserId);
router.get("/", getListings);
router.delete("/:id", authenticateToken, deleteListing);

export default router;
