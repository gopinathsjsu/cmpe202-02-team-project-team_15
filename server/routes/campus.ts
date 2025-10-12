import express from 'express';

// Get models dynamically to avoid ES module issues
let models: any = null;

const getModels = async () => {
  if (!models) {
    const { getModels: getModelsFunc } = await import('../models/index.ts');
    models = await getModelsFunc();
  }
  return models;
};

import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateCampusCreation } from '../middleware/validation.js';

const router = express.Router();

// @route   GET /api/campus
// @desc    Get all campuses
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { Campus } = await getModels();
    const campuses = await Campus.find().sort({ name: 1 });

    res.json({
      success: true,
      data: { campuses }
    });

  } catch (error) {
    console.error('Get campuses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get campuses',
      error: error.message
    });
  }
});

// @route   GET /api/campus/:id
// @desc    Get campus by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { Campus } = await getModels();
    const campus = await Campus.findById(req.params.id);

    if (!campus) {
      return res.status(404).json({
        success: false,
        message: 'Campus not found'
      });
    }

    res.json({
      success: true,
      data: { campus }
    });

  } catch (error) {
    console.error('Get campus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get campus',
      error: error.message
    });
  }
});

// @route   POST /api/campus
// @desc    Create new campus (Admin only)
// @access  Private (Admin)
router.post('/', authenticateToken, requireRole(['admin']), validateCampusCreation, async (req, res) => {
  try {
    const { name, email_domain } = req.body;
    const { Campus } = await getModels();

    // Check if campus with same name or email domain already exists
    const existingCampus = await Campus.findOne({
      $or: [
        { name: name },
        { email_domain: email_domain }
      ]
    });

    if (existingCampus) {
      return res.status(400).json({
        success: false,
        message: 'Campus with this name or email domain already exists'
      });
    }

    const campus = new Campus({
      name: name.trim(),
      email_domain: email_domain.toLowerCase().trim()
    });

    await campus.save();

    res.status(201).json({
      success: true,
      message: 'Campus created successfully',
      data: { campus }
    });

  } catch (error) {
    console.error('Create campus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create campus',
      error: error.message
    });
  }
});

// @route   PUT /api/campus/:id
// @desc    Update campus (Admin only)
// @access  Private (Admin)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, email_domain } = req.body;
    const { Campus } = await getModels();

    const campus = await Campus.findById(req.params.id);
    if (!campus) {
      return res.status(404).json({
        success: false,
        message: 'Campus not found'
      });
    }

    // Check if another campus has the same name or email domain
    const existingCampus = await Campus.findOne({
      _id: { $ne: req.params.id },
      $or: [
        { name: name },
        { email_domain: email_domain }
      ]
    });

    if (existingCampus) {
      return res.status(400).json({
        success: false,
        message: 'Another campus with this name or email domain already exists'
      });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email_domain) updateData.email_domain = email_domain.toLowerCase().trim();

    const updatedCampus = await Campus.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Campus updated successfully',
      data: { campus: updatedCampus }
    });

  } catch (error) {
    console.error('Update campus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update campus',
      error: error.message
    });
  }
});

// @route   DELETE /api/campus/:id
// @desc    Delete campus (Admin only)
// @access  Private (Admin)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { Campus } = await getModels();
    const campus = await Campus.findById(req.params.id);
    if (!campus) {
      return res.status(404).json({
        success: false,
        message: 'Campus not found'
      });
    }

    // Note: Since we removed campus_id from users, we can delete campus without checking user associations

    await Campus.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Campus deleted successfully'
    });

  } catch (error) {
    console.error('Delete campus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete campus',
      error: error.message
    });
  }
});

// @route   GET /api/campus/:id/users
// @desc    Get users by campus (Admin only)
// @access  Private (Admin)
router.get('/:id/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const { Campus, User } = await getModels();
    
    const campus = await Campus.findById(req.params.id);
    if (!campus) {
      return res.status(404).json({
        success: false,
        message: 'Campus not found'
      });
    }

    // Note: Since we removed campus_id from users, this endpoint is no longer relevant
    // Return empty result or consider removing this endpoint entirely
    const query: any = {};
    if (status) query.status = status;

    const users = await User.find(query)
      .select('-password_hash')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ created_at: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        campus,
        users,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_users: total,
          per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get campus users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get campus users',
      error: error.message
    });
  }
});

export default router;

