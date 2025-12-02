import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Listing, { IListing } from '../models/Listing';
import Category from '../models/Category';

// API Request/Response types for search functionality
export interface SearchQuery {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: 'createdAt_desc' | 'createdAt_asc' | 'price_desc' | 'price_asc';
  page?: string;
  pageSize?: string;
}

export interface PaginationInfo {
  current: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SearchResponse {
  items: IListing[];
  page: PaginationInfo;
}

export interface ErrorResponse {
  error: string;
}

// Utility function to resolve category ID from name or ObjectId
const resolveCategoryId = async (category: string): Promise<string | null> => {
  // If category is an ObjectId, use it directly
  if (mongoose.Types.ObjectId.isValid(category)) {
    return category;
  }
  
  // If category is a name, find the category first
  const categoryDoc = await Category.findOne({ 
    name: { $regex: category, $options: 'i' } 
  });
  
  return categoryDoc ? categoryDoc._id.toString() : null;
};

// GET /api/listings/search - Search and filter listings
// US-SEARCH-1: Supports query `q`, category, min/max price, pagination, sorting
export const searchListings = async (req: Request<{}, SearchResponse, {}, SearchQuery>, res: Response<SearchResponse | ErrorResponse>): Promise<void> => {
  try {
    const { 
      q, 
      category, 
      minPrice, 
      maxPrice, 
      sort = 'createdAt_desc', 
      page = '1', 
      pageSize = '20'
    } = req.query;

    // Build filter object - only show ACTIVE listings (unless admin)
    const filter: any = { status: 'ACTIVE' };

    // Check if user is admin
    const authUser = (req as any).user;
    const isAdmin = authUser?.roles?.includes('admin');
    
    // Filter by university for non-admin users
    if (!isAdmin && authUser) {
      // Get user's university from the authenticated user object
      // The auth middleware already fetches the full user from DB
      const userUniversity = authUser.university;
      if (userUniversity) {
        filter.university = userUniversity;
        console.log(`[Search] Filtering by university: ${userUniversity}`);
      } else {
        console.log(`[Search] WARNING: User ${authUser._id} has no university set`);
      }
    }
    
    // Hide hidden listings from non-admin users
    if (!isAdmin) {
      filter.isHidden = { $ne: true };
    }

    // Text search on title and description - partial matching
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i'); // Case-insensitive partial matching
      filter.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } }
      ];
    }

    // Category filter
    if (category) {
      const categoryId = await resolveCategoryId(category);
      if (categoryId) {
        filter.categoryId = categoryId;
      } else {
        // If category not found, return error
        res.status(400).json({ error: 'Category not found' });
        return;
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {
        ...(minPrice && { $gte: Number(minPrice) }),
        ...(maxPrice && { $lte: Number(maxPrice) })
      };
    }

    // Sorting options - createdAt (default desc) or price
    const sortMap = {
      'price_asc': { price: 1 },
      'price_desc': { price: -1 },
      'createdAt_asc': { createdAt: 1 },
      'createdAt_desc': { createdAt: -1 }
    } as const;
    
    const sortObj = sortMap[sort as keyof typeof sortMap] || sortMap.createdAt_desc;

    // Pagination with page/pageSize
    const skip = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    // Execute query with population
    const [items, total] = await Promise.all([
      Listing.find(filter)
        .populate('categoryId', 'name')
        .populate('userId', 'name email')
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      Listing.countDocuments(filter)
    ]);

    // Response returns list with page object
    res.json({
      items,
      page: {
        current: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });

  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/listings/categories - Get all categories (needed for category filtering)
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().select('name description').sort('name');
    res.json({ categories });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/listings/:id - Get a single listing by ID
export const getListingById = async (req: Request<{ id: string }>, res: Response<IListing | ErrorResponse>): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Listing ID is required' });
      return;
    }

    let listing;

    // Check if the ID is a MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      // Find by _id (MongoDB ObjectId)
      listing = await Listing.findById(id)
        .populate('categoryId', 'name description')
        .populate('userId', 'first_name last_name email campusId');
    } else if (id.match(/^LST-\d{8}-\d{4}$/)) {
      // Find by custom listingId format (LST-YYYYMMDD-XXXX)
      listing = await Listing.findOne({ listingId: id })
        .populate('categoryId', 'name description')
        .populate('userId', 'first_name last_name email campusId');
    } else {
      res.status(400).json({ error: 'Invalid listing ID format. Expected MongoDB ObjectId or LST-YYYYMMDD-XXXX format' });
      return;
    }

    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    // Check university access - non-admin users can only view listings from their university
    const authUser = (req as any).user;
    if (authUser) {
      const isAdmin = authUser?.roles?.includes('admin');
      
      if (!isAdmin) {
        // Get user's university from the authenticated user object
        const userUniversity = authUser.university;
        
        if (userUniversity && listing.university && listing.university !== userUniversity) {
          console.log(`[GetListing] Access denied: User university ${userUniversity} != Listing university ${listing.university}`);
          res.status(403).json({ error: 'Access denied: Listing belongs to a different university' });
          return;
        }
      }
    }

    // Allow both ACTIVE and SOLD listings to be viewed
    // Users should be able to view sold listings, especially if they have them saved
    res.json(listing);
  } catch (err: any) {
    console.error('Get listing error:', err);
    res.status(500).json({ error: err.message });
  }
};