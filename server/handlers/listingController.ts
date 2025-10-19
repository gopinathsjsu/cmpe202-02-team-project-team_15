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
  return res.json({ success: true, listing });
};

export const getListings = (_req: Request, res: Response) => {
  res.json({ success: true, listings });
};

export const deleteListing = (req: Request, res: Response) => {
  const { id } = req.params;
  const listingIndex = listings.findIndex((l) => l.id === Number(id));
  
  if (listingIndex === -1) {
    return res.status(404).json({ success: false, message: "Listing not found" });
  }
  
  const deletedListing = listings.splice(listingIndex, 1)[0];
  return res.json({ success: true, message: "Listing deleted successfully", listing: deletedListing });
};

// // Example with MongoDB and authorization
// export const deleteListing = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user.id; // From auth middleware
    
//     const listing = await Listing.findOneAndDelete({
//       _id: id,
//       userId: userId // Ensure user owns the listing
//     });
    
//     if (!listing) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Listing not found or you don't have permission to delete it" 
//       });
//     }
    
//     return res.json({ 
//       success: true, 
//       message: "Listing deleted successfully" 
//     });
//   } catch (error) {
//     return res.status(500).json({ 
//       success: false, 
//       message: "Internal server error" 
//     });
//   }
// };