import { Router } from "express";
import { createListing, markAsSold, getListings, deleteListing } from "../handlers/listingController";

const router = Router();

router.post("/", createListing);
router.patch("/:id/sold", markAsSold);
router.get("/", getListings);
router.delete("/:id", deleteListing);

export default router;
