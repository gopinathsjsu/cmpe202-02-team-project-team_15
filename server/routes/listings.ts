import { Router } from "express";
import { createListing, markAsSold, getListings } from "../controllers/listingController";

const router = Router();

router.post("/", createListing);
router.patch("/:id/sold", markAsSold);
router.get("/", getListings);

export default router;
