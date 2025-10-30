import { Request, Response } from 'express';
import { SavedListing } from '../models/SavedListing';
import Listing from '../models/Listing';

/**
 * Save a listing for the authenticated user
 */
export const saveListing = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { listingId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!listingId) {
      return res.status(400).json({ error: 'Listing ID is required' });
    }

    // Check if listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Check if already saved
    const existingSaved = await SavedListing.findOne({ userId, listingId });
    if (existingSaved) {
      return res.status(400).json({ error: 'Listing already saved' });
    }

    // Create saved listing
    const savedListing = new SavedListing({
      userId,
      listingId
    });

    await savedListing.save();

    return res.status(201).json({
      message: 'Listing saved successfully',
      savedListing: {
        id: savedListing._id,
        listingId: savedListing.listingId,
        savedAt: savedListing.saved_at
      }
    });
  } catch (error: any) {
    console.error('Error saving listing:', error);
    return res.status(500).json({ error: 'Failed to save listing' });
  }
};

/**
 * Unsave a listing for the authenticated user
 */
export const unsaveListing = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { listingId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!listingId) {
      return res.status(400).json({ error: 'Listing ID is required' });
    }

    // Find and delete the saved listing
    const result = await SavedListing.findOneAndDelete({ userId, listingId });

    if (!result) {
      return res.status(404).json({ error: 'Saved listing not found' });
    }

    return res.status(200).json({
      message: 'Listing unsaved successfully'
    });
  } catch (error: any) {
    console.error('Error unsaving listing:', error);
    return res.status(500).json({ error: 'Failed to unsave listing' });
  }
};

/**
 * Get all saved listings for the authenticated user
 */
export const getSavedListings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get saved listings with full listing details
    const savedListings = await SavedListing.find({ userId })
      .populate({
        path: 'listingId',
        populate: [
          { path: 'categoryId', select: 'name' },
          { path: 'userId', select: 'first_name last_name email' }
        ]
      })
      .sort({ saved_at: -1 });

    // Filter out any saved listings where the listing was deleted
    const validSavedListings = savedListings.filter(saved => saved.listingId);

    // Format the response
    const formattedListings = validSavedListings.map(saved => ({
      savedId: saved._id,
      savedAt: saved.saved_at,
      listing: saved.listingId
    }));

    return res.status(200).json({
      savedListings: formattedListings,
      count: formattedListings.length
    });
  } catch (error: any) {
    console.error('Error fetching saved listings:', error);
    return res.status(500).json({ error: 'Failed to fetch saved listings' });
  }
};

/**
 * Check if a listing is saved by the authenticated user
 */
export const checkIfSaved = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { listingId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!listingId) {
      return res.status(400).json({ error: 'Listing ID is required' });
    }

    const savedListing = await SavedListing.findOne({ userId, listingId });

    return res.status(200).json({
      isSaved: !!savedListing
    });
  } catch (error: any) {
    console.error('Error checking saved status:', error);
    return res.status(500).json({ error: 'Failed to check saved status' });
  }
};

/**
 * Get saved listing IDs for the authenticated user (for quick lookup)
 */
export const getSavedListingIds = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const savedListings = await SavedListing.find({ userId }).select('listingId');
    const listingIds = savedListings.map(saved => saved.listingId.toString());

    return res.status(200).json({
      listingIds
    });
  } catch (error: any) {
    console.error('Error fetching saved listing IDs:', error);
    return res.status(500).json({ error: 'Failed to fetch saved listing IDs' });
  }
};

