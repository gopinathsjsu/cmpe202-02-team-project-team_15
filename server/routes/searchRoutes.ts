import express from 'express';
import { searchListings, getCategories, getListingById } from '../handlers/search';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// GET /api/listings/search - Search and filter listings (requires auth for university filtering)
router.get('/search', authenticateToken, searchListings);

// GET /api/listings/categories - Get all categories (public - no university filtering needed)
router.get('/categories', getCategories);

// GET /api/listings/:id - Get a single listing by ID (requires auth for university filtering)
router.get('/:id', authenticateToken, getListingById);

export default router;
