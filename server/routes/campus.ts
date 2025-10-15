import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateCampusCreation } from '../middleware/validation';
import { CampusController } from '../controllers';

const router = express.Router();

// @route   GET /api/campus
// @desc    Get all campuses
// @access  Public
router.get('/', CampusController.getAllCampuses);

// @route   GET /api/campus/:id
// @desc    Get campus by ID
// @access  Public
router.get('/:id', CampusController.getCampusById);

// @route   POST /api/campus
// @desc    Create new campus (Admin only)
// @access  Private (Admin)
router.post('/', authenticateToken, requireRole(['admin']), validateCampusCreation, CampusController.createCampus);

// @route   PUT /api/campus/:id
// @desc    Update campus (Admin only)
// @access  Private (Admin)
router.put('/:id', authenticateToken, requireRole(['admin']), CampusController.updateCampus);

// @route   DELETE /api/campus/:id
// @desc    Delete campus (Admin only)
// @access  Private (Admin)
router.delete('/:id', authenticateToken, requireRole(['admin']), CampusController.deleteCampus);

// @route   GET /api/campus/:id/users
// @desc    Get users by campus (Admin only)
// @access  Private (Admin)
router.get('/:id/users', authenticateToken, requireRole(['admin']), CampusController.getCampusUsers);

export default router;