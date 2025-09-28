const express = require('express');
const { Campus, User } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateCampusCreation } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/campus
// @desc    Get all campuses
// @access  Public
router.get('/', async (req, res) => {
  try {
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
    const campus = await Campus.findById(req.params.id);
    if (!campus) {
      return res.status(404).json({
        success: false,
        message: 'Campus not found'
      });
    }

    // Check if there are users associated with this campus
    const userCount = await User.countDocuments({ campus_id: req.params.id });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete campus. ${userCount} users are associated with this campus.`
      });
    }

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
    
    const campus = await Campus.findById(req.params.id);
    if (!campus) {
      return res.status(404).json({
        success: false,
        message: 'Campus not found'
      });
    }

    const query = { campus_id: req.params.id };
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

module.exports = router;
