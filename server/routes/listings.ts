import { Router } from "express";
import { createListing, markAsSold, getListings, getMyListings, deleteListing } from "../handlers/listingController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/", authenticateToken, createListing);
router.patch("/:id/sold", authenticateToken, markAsSold);
router.get("/my-listings", authenticateToken, getMyListings);
router.get("/", getListings);
router.delete("/:id", authenticateToken, deleteListing);

export default router;
