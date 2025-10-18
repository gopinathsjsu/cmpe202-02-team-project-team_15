import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateCampusCreation } from '../middleware/validation';
import { CampusHandler } from '../handlers/campusHandler';

const router = express.Router();

// @route   GET /api/campus
// @desc    Get all campuses
// @access  Public
router.get('/', CampusHandler.getAllCampuses);

// @route   GET /api/campus/:id
// @desc    Get campus by ID
// @access  Public
router.get('/:id', CampusHandler.getCampusById);

// @route   POST /api/campus
// @desc    Create new campus (Admin only)
// @access  Private (Admin)
router.post('/', authenticateToken, requireRole(['admin']), validateCampusCreation, CampusHandler.createCampus);

// @route   PUT /api/campus/:id
// @desc    Update campus (Admin only)
// @access  Private (Admin)
router.put('/:id', authenticateToken, requireRole(['admin']), CampusHandler.updateCampus);

// @route   DELETE /api/campus/:id
// @desc    Delete campus (Admin only)
// @access  Private (Admin)
router.delete('/:id', authenticateToken, requireRole(['admin']), CampusHandler.deleteCampus);

// @route   GET /api/campus/:id/users
// @desc    Get users by campus (Admin only)
// @access  Private (Admin)
router.get('/:id/users', authenticateToken, requireRole(['admin']), CampusHandler.getCampusUsers);

export default router;