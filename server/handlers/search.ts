import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Listing from '../models/Listing';
import Category from '../models/Category';
import { SearchQuery, SearchResponse, ErrorResponse, IListing } from '../types';

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

    // Text search on title and description
    if (q && q.trim()) {
      filter.$text = { $search: q.trim() };
    }

    // Category filter
    if (category) {
      // If category is an ObjectId, use it directly
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.categoryId = category;
      } else {
        // If category is a name, find the category first
        const categoryDoc = await Category.findOne({ 
          name: { $regex: category, $options: 'i' } 
        });
        if (categoryDoc) {
          filter.categoryId = categoryDoc._id;
        } else {
          // If category not found, return empty results
          res.json({
            items: [],
            page: {
              current: Number(page),
              pageSize: Number(pageSize),
              total: 0,
              totalPages: 0
            }
          });
          return;
        }
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Sorting options - createdAt (default desc) or price
    let sortObj: any = {};
    switch (sort) {
      case 'price_asc':
        sortObj.price = 1;
        break;
      case 'price_desc':
        sortObj.price = -1;
        break;
      case 'createdAt_asc':
        sortObj.createdAt = 1;
        break;
      case 'createdAt_desc':
      default:
        sortObj.createdAt = -1;
        break;
    }

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
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/listings/:id - Get a single listing by ID
export const getListingById = async (req: Request<{ id: string }>, res: Response<IListing | ErrorResponse>): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid listing ID format' });
      return;
    }

    // Find the listing with populated references
    const listing = await Listing.findById(id)
      .populate('categoryId', 'name description')
      .populate('userId', 'name email campusId');

    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    // Only show ACTIVE listings (unless admin - for future implementation)
    if (listing.status !== 'ACTIVE') {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    res.json(listing);
  } catch (err: any) {
    console.error('Get listing error:', err);
    res.status(500).json({ error: err.message });
  }
};