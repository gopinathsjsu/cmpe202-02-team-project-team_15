// routes/search.js
const express = require('express');
const Listing = require('../models/Listing');
const Category = require('../models/Category');
const User = require('../models/User');
const mongoose = require('mongoose');

const router = express.Router();

// GET /api/listings/search - Search and filter listings
// US-SEARCH-1: Supports query `q`, category, min/max price, pagination, sorting
router.get('/search', async (req, res) => {
  try {
    const { 
      q, 
      category, 
      minPrice, 
      maxPrice, 
      sort = 'createdAt_desc', 
      page = 1, 
      pageSize = 20
    } = req.query;

    // Build filter object - only show ACTIVE listings (unless admin)
    const filter = { status: 'ACTIVE' };

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
          return res.json({
            items: [],
            page: {
              current: Number(page),
              pageSize: Number(pageSize),
              total: 0
            }
          });
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
    let sortObj = {};
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

  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/listings/categories - Get all categories (needed for category filtering)
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().select('name description').sort('name');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
