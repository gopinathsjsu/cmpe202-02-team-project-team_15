import { Request, Response } from "express";
import mongoose from 'mongoose';
import Listing, { IListing } from '../models/Listing';
import Category from '../models/Category';
import { Report } from '../models/Report';
import { SavedListing } from '../models/SavedListing';

const TITLE_MIN_LENGTH = 5;
const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MIN_LENGTH = 20;
const DESCRIPTION_MAX_LENGTH = 1000;
const PRICE_MIN = 1;
const PRICE_MAX = 10000;
const MAX_PHOTOS = 5;
const SANITIZED_ALT_MAX = 120;

const sanitizeText = (value: string): string =>
  value.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();

interface ListingValidationResult {
  errors: string[];
  data: Partial<{
    title: string;
    description: string;
    price: number;
    categoryId: string;
    photos: Array<{ url: string; alt: string }>;
    status: 'ACTIVE' | 'SOLD';
  }>;
}

const validateListingInput = (
  payload: any,
  options: { partial: boolean } = { partial: false }
): ListingValidationResult => {
  const errors: string[] = [];
  const data: ListingValidationResult['data'] = {};

  if (!options.partial || payload.title !== undefined) {
    if (typeof payload.title !== 'string') {
      errors.push('Title must be a string');
    } else {
      const sanitized = sanitizeText(payload.title);
      if (
        sanitized.length < TITLE_MIN_LENGTH ||
        sanitized.length > TITLE_MAX_LENGTH
      ) {
        errors.push(
          `Title must be between ${TITLE_MIN_LENGTH} and ${TITLE_MAX_LENGTH} characters`
        );
      } else {
        data.title = sanitized;
      }
    }
  }

  if (!options.partial || payload.description !== undefined) {
    if (typeof payload.description !== 'string') {
      errors.push('Description must be a string');
    } else {
      const sanitized = sanitizeText(payload.description);
      if (
        sanitized.length < DESCRIPTION_MIN_LENGTH ||
        sanitized.length > DESCRIPTION_MAX_LENGTH
      ) {
        errors.push(
          `Description must be between ${DESCRIPTION_MIN_LENGTH} and ${DESCRIPTION_MAX_LENGTH} characters`
        );
      } else {
        data.description = sanitized;
      }
    }
  }

  if (!options.partial || payload.price !== undefined) {
    const priceValue = Number(payload.price);
    if (Number.isNaN(priceValue)) {
      errors.push('Price must be a valid number');
    } else if (priceValue < PRICE_MIN || priceValue > PRICE_MAX) {
      errors.push(`Price must be between ${PRICE_MIN} and ${PRICE_MAX}`);
    } else {
      data.price = Number(priceValue.toFixed(2));
    }
  }

  if (!options.partial || payload.categoryId !== undefined) {
    if (
      typeof payload.categoryId !== 'string' ||
      !mongoose.Types.ObjectId.isValid(payload.categoryId)
    ) {
      errors.push('categoryId must be a valid ID');
    } else {
      data.categoryId = payload.categoryId;
    }
  }

  if (payload.status !== undefined) {
    if (payload.status !== 'ACTIVE' && payload.status !== 'SOLD') {
      errors.push('status must be ACTIVE or SOLD');
    } else {
      data.status = payload.status;
    }
  }

  if (!options.partial || payload.photos !== undefined) {
    if (payload.photos === undefined) {
      data.photos = [];
    } else if (!Array.isArray(payload.photos)) {
      errors.push('photos must be an array');
    } else if (payload.photos.length > MAX_PHOTOS) {
      errors.push(`You can upload up to ${MAX_PHOTOS} images`);
    } else {
      data.photos = payload.photos.map((photo: any, index: number) => {
        if (!photo || typeof photo.url !== 'string') {
          errors.push(`Photo at position ${index + 1} is missing a valid url`);
        }
        const alt =
          typeof photo?.alt === 'string'
            ? sanitizeText(photo.alt).slice(0, SANITIZED_ALT_MAX)
            : '';
        return {
          url: typeof photo?.url === 'string' ? photo.url : '',
          alt
        };
      });
    }
  }

  return { errors, data };
};

// POST /api/listings - Create a new listing
export const createListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, price, categoryId, photos = [] } = req.body;

    const validation = validateListingInput(
      { title, description, price, categoryId, photos },
      { partial: false }
    );

    if (validation.errors.length > 0) {
      res.status(400).json({
        success: false,
        error: validation.errors.join('. ')
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
    const category = await Category.findById(validation.data.categoryId);
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
      categoryId: validation.data.categoryId,
      title: validation.data.title,
      description: validation.data.description,
      price: validation.data.price,
      photos: (validation.data.photos || []).map((photo, index) => ({
        url: photo.url,
        alt: photo.alt || validation.data.title || `Photo ${index + 1}`
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
    console.error('Delete listing error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// GET /api/listings/user/:userId - Get listings by user ID (public)
export const getListingsByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status = 'ACTIVE', page = 1, limit = 20 } = req.query;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid user ID format' 
      });
      return;
    }

    const filter: any = { userId };
    if (status) {
      filter.status = status;
    }

    // Always hide hidden listings from public view
    filter.isHidden = { $ne: true };

    const skip = (Number(page) - 1) * Number(limit);
    
    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate('categoryId', 'name description')
        .populate('userId', 'first_name last_name email')
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
    console.error('Get listings by user ID error:', error);
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

    // Check if user is admin
    const authUser = (req as any).user;
    const isAdmin = authUser?.roles?.includes('admin');
    
    // Hide hidden listings from non-admin users
    if (!isAdmin) {
      filter.isHidden = { $ne: true };
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

// GET /api/listings/my-listings - Get all listings for the authenticated user
export const getMyListings = async (req: Request, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated
    const authUser = (req as any).user;
    if (!authUser || !authUser._id) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const { status, page = 1, limit = 20 } = req.query;
    
    const filter: any = { userId: authUser._id };
    if (status && (status === 'ACTIVE' || status === 'SOLD')) {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate('categoryId', 'name description')
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
    console.error('Get my listings error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// PUT /api/listings/:id - Update a listing
export const updateListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, price, categoryId, photos, status } = req.body;

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
        error: 'You can only edit your own listings' 
      });
      return;
    }

    const validation = validateListingInput(
      { title, description, price, categoryId, photos, status },
      { partial: true }
    );

    if (validation.errors.length > 0) {
      res.status(400).json({
        success: false,
        error: validation.errors.join('. ')
      });
      return;
    }

    // Validate category if provided
    if (
      validation.data.categoryId &&
      validation.data.categoryId !== listing.categoryId.toString()
    ) {
      const category = await Category.findById(validation.data.categoryId);
      if (!category) {
        res.status(400).json({ 
          success: false, 
          error: 'Category not found' 
        });
        return;
      }
    }

    // Update listing fields
    const updateData: any = {};
    if (validation.data.title !== undefined) updateData.title = validation.data.title;
    if (validation.data.description !== undefined) updateData.description = validation.data.description;
    if (validation.data.price !== undefined) updateData.price = validation.data.price;
    if (validation.data.categoryId !== undefined) updateData.categoryId = validation.data.categoryId;
    if (validation.data.status !== undefined) updateData.status = validation.data.status;
    if (validation.data.photos !== undefined) {
      updateData.photos = validation.data.photos.map((photo, index) => ({
        url: photo.url,
        alt:
          photo.alt ||
          validation.data.title ||
          listing.title ||
          `Photo ${index + 1}`
      }));
    }

    // Update the listing
    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).populate([
      { path: 'categoryId', select: 'name description' },
      { path: 'userId', select: 'first_name last_name email' }
    ]);

    res.json({ 
      success: true, 
      listing: updatedListing 
    });
  } catch (error: any) {
    console.error('Update listing error:', error);
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

    // Check if the authenticated user owns the listing or is an admin
    const listingUserId = listing.userId.toString();
    const authUserId = authUser._id.toString();
    const isAdmin = authUser.roles?.includes('admin');

    if (listingUserId !== authUserId && !isAdmin) {
      res.status(403).json({ 
        success: false, 
        error: 'You can only delete your own listings' 
      });
      return;
    }

    // Delete the listing
    await Listing.findByIdAndDelete(id);

    // Also delete all reports associated with this listing
    await Report.deleteMany({ listingId: id });

    // Delete all saved listings references
    await SavedListing.deleteMany({ listingId: id });

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