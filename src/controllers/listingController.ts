import { Request, Response } from "express";

let listings: any[] = [];

export const createListing = (req: Request, res: Response) => {
  const { title, description, price, photos } = req.body;
  const newListing = {
    id: listings.length + 1,
    title,
    description,
    price,
    photos,
    status: "available",
  };
  listings.push(newListing);
  res.status(201).json({ success: true, listing: newListing });
};

export const markAsSold = (req: Request, res: Response) => {
  const { id } = req.params;
  const listing = listings.find((l) => l.id === Number(id));
  if (!listing) {
    return res.status(404).json({ success: false, message: "Listing not found" });
  }
  listing.status = "sold";
  res.json({ success: true, listing });
};

export const getListings = (_req: Request, res: Response) => {
  res.json({ success: true, listings });
};
