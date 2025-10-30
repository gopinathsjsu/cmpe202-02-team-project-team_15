import { Request, Response } from "express";
import mongoose from 'mongoose';
import Listing, { IListing } from '../models/Listing';
import Category from '../models/Category';

// POST /api/listings - Create a new listing
export const createListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, price, categoryId, photos = [] } = req.body;

    // Validate required fields
    if (!title || !description || !price || !categoryId) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title, description, price, categoryId' 
      });
      return;
    }

    // Ensure user is authenticated
    const authUser = (req as any).user;
    if (!authUser || !authUser._id) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Validate category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      res.status(400).json({ 
        success: false, 
        error: 'Category not found' 
      });
      return;
    }

    // Create new listing
    const newListing = new Listing({
      userId: authUser._id,
      categoryId,
      title,
      description,
      price: Number(price),
      photos: photos.map((photo: any) => ({
        url: photo.url || '',
        alt: photo.alt || title
      })),
      status: 'ACTIVE'
    });

    const savedListing = await newListing.save();

    // Populate the response with category and user info
    await savedListing.populate([
      { path: 'categoryId', select: 'name description' },
      { path: 'userId', select: 'name email' }
    ]);

    res.status(201).json({ 
      success: true, 
      listing: savedListing 
    });
  } catch (error: any) {
    console.error('Create listing error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// GET /api/listings - Get all listings (for admin or general listing)
export const getListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status = 'ACTIVE', page = 1, limit = 20 } = req.query;
    
    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate('categoryId', 'name description')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Listing.countDocuments(filter)
    ]);

    res.json({ 
      success: true, 
      listings,
      pagination: {
        current: Number(page),
        pageSize: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Get listings error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// PATCH /api/listings/:id/sold - Mark listing as sold
export const markAsSold = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid listing ID format' 
      });
      return;
    }

    const listing = await Listing.findByIdAndUpdate(
      id,
      { status: 'SOLD', updatedAt: new Date() },
      { new: true }
    ).populate([
      { path: 'categoryId', select: 'name description' },
      { path: 'userId', select: 'name email' }
    ]);

    if (!listing) {
      res.status(404).json({ 
        success: false, 
        error: 'Listing not found' 
      });
      return;
    }

    res.json({ 
      success: true, 
      listing 
    });
  } catch (error: any) {
    console.error('Mark as sold error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// DELETE /api/listings/:id - Delete a listing
export const deleteListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid listing ID format' 
      });
      return;
    }

    // Ensure user is authenticated
    const authUser = (req as any).user;
    if (!authUser || !authUser._id) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Find the listing first to check ownership
    const listing = await Listing.findById(id);

    if (!listing) {
      res.status(404).json({ 
        success: false, 
        error: 'Listing not found' 
      });
      return;
    }

    // Check if the authenticated user owns the listing
    const listingUserId = listing.userId.toString();
    const authUserId = authUser._id.toString();

    if (listingUserId !== authUserId) {
      res.status(403).json({ 
        success: false, 
        error: 'You can only delete your own listings' 
      });
      return;
    }

    // Delete the listing
    await Listing.findByIdAndDelete(id);

    res.json({ 
      success: true, 
      message: 'Listing deleted successfully',
      listing 
    });
  } catch (error: any) {
    console.error('Delete listing error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};