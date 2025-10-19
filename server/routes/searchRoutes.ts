import express from 'express';
import { searchListings, getCategories, getListingById } from '../handlers/search';

const router = express.Router();

// GET /api/listings/search - Search and filter listings
router.get('/search', searchListings);

// GET /api/listings/categories - Get all categories (needed for category filtering)
router.get('/categories', getCategories);

// GET /api/listings/:id - Get a single listing by ID
router.get('/:id', getListingById);

export default router;
