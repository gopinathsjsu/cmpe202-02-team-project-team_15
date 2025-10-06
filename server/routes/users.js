const express = require('express');
const { User, UserRole, Role, AuditLog, Campus } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateRoleAssignment } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password_hash');

    // Get user roles
    const userRoles = await UserRole.find({ user_id: user._id }).populate('role_id');
    const roles = userRoles.map(ur => ur.role_id.name);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          full_name: user.full_name,
          status: user.status,
          email_verified_at: user.email_verified_at,
          roles: roles,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name } = req.body;
    
    const updateData = {};
    if (first_name) updateData.first_name = first_name.trim();
    if (last_name) updateData.last_name = last_name.trim();

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password_hash');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password_hash')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ created_at: -1 });

    const total = await User.countDocuments(query);

    // Get roles for each user
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const userRoles = await UserRole.find({ user_id: user._id }).populate('role_id');
        const roles = userRoles.map(ur => ur.role_id.name);
        return {
          ...user.toObject(),
          roles
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithRoles,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_users: total,
          per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private (Admin)
router.get('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password_hash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user roles
    const userRoles = await UserRole.find({ user_id: user._id }).populate('role_id');
    const roles = userRoles.map(ur => ur.role_id.name);

    res.json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          roles
        }
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message
    });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Update user status (Admin only)
// @access  Private (Admin)
router.put('/:id/status', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending_verification', 'active', 'suspended', 'deleted'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).select('-password_hash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log audit event
    const action = status === 'suspended' ? 'SUSPEND_USER' : 'REACTIVATE_USER';
    await AuditLog.create({
      user_id: req.user._id,
      action,
      metadata: { 
        target_user_id: user._id,
        new_status: status,
        old_status: user.status
      }
    });

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
});

// @route   POST /api/users/:id/roles
// @desc    Assign role to user (Admin only)
// @access  Private (Admin)
router.post('/:id/roles', authenticateToken, requireRole(['admin']), validateRoleAssignment, async (req, res) => {
  try {
    const { role_id } = req.body;
    const user_id = req.params.id;

    // Check if user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if role exists
    const role = await Role.findById(role_id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if user already has this role
    const existingUserRole = await UserRole.findOne({ user_id, role_id });
    if (existingUserRole) {
      return res.status(400).json({
        success: false,
        message: 'User already has this role'
      });
    }

    // Assign role
    await UserRole.create({ user_id, role_id });

    // Log audit event
    await AuditLog.create({
      user_id: req.user._id,
      action: 'ASSIGN_ROLE',
      metadata: { 
        target_user_id: user_id,
        role_name: role.name,
        role_id
      }
    });

    res.json({
      success: true,
      message: 'Role assigned successfully'
    });

  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign role',
      error: error.message
    });
  }
});

// @route   DELETE /api/users/:id/roles/:roleId
// @desc    Remove role from user (Admin only)
// @access  Private (Admin)
router.delete('/:id/roles/:roleId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id: user_id, roleId: role_id } = req.params;

    // Check if user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if role exists
    const role = await Role.findById(role_id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Remove role
    const userRole = await UserRole.findOneAndDelete({ user_id, role_id });
    if (!userRole) {
      return res.status(404).json({
        success: false,
        message: 'User does not have this role'
      });
    }

    // Log audit event
    await AuditLog.create({
      user_id: req.user._id,
      action: 'REVOKE_ROLE',
      metadata: { 
        target_user_id: user_id,
        role_name: role.name,
        role_id
      }
    });

    res.json({
      success: true,
      message: 'Role removed successfully'
    });

  } catch (error) {
    console.error('Remove role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove role',
      error: error.message
    });
  }
});

module.exports = router;
