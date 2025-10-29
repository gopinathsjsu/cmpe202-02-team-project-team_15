import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  saveListing,
  unsaveListing,
  getSavedListings,
  checkIfSaved,
  getSavedListingIds
} from '../handlers/savedListingHandler';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/saved-listings
 * @desc    Save a listing for the authenticated user
 * @access  Private
 */
router.post('/', saveListing);

/**
 * @route   GET /api/saved-listings
 * @desc    Get all saved listings for the authenticated user
 * @access  Private
 */
router.get('/', getSavedListings);

/**
 * @route   GET /api/saved-listings/ids
 * @desc    Get saved listing IDs for quick lookup
 * @access  Private
 */
router.get('/ids', getSavedListingIds);

/**
 * @route   GET /api/saved-listings/check/:listingId
 * @desc    Check if a listing is saved
 * @access  Private
 */
router.get('/check/:listingId', checkIfSaved);

/**
 * @route   DELETE /api/saved-listings/:listingId
 * @desc    Unsave a listing
 * @access  Private
 */
router.delete('/:listingId', unsaveListing);

export default router;

