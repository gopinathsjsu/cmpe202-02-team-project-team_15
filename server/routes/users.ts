import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRoleAssignment } from '../middleware/validation';
import { UserController } from '../controllers';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, UserController.getProfile);

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', authenticateToken, UserController.updateProfile);

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', authenticateToken, requireRole(['admin']), UserController.getAllUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private (Admin)
router.get('/:id', authenticateToken, requireRole(['admin']), UserController.getUserById);

// @route   PUT /api/users/:id/status
// @desc    Update user status (Admin only)
// @access  Private (Admin)
router.put('/:id/status', authenticateToken, requireRole(['admin']), UserController.updateUserStatus);

// @route   POST /api/users/:id/roles
// @desc    Assign role to user (Admin only)
// @access  Private (Admin)
router.post('/:id/roles', authenticateToken, requireRole(['admin']), validateRoleAssignment, UserController.assignRole);

// @route   DELETE /api/users/:id/roles/:roleId
// @desc    Remove role from user (Admin only)
// @access  Private (Admin)
router.delete('/:id/roles/:roleId', authenticateToken, requireRole(['admin']), UserController.removeRole);

export default router;