import { Request, Response } from 'express';
import { User } from '../models/User';
import { UserRole } from '../models/UserRole';
import { Role } from '../models/Role';
import { AuditLog } from '../models/AuditLog';

export class UserHandler {
  // @desc    Get current user profile
  // @access  Private
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = await User.findById((req as any).user._id)
        .select('-password_hash');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Get user roles
      const userRoles = await UserRole.find({ user_id: user._id }).populate('role_id');
      const roles = userRoles.map((ur: any) => ur.role_id.name);

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
            bio: user.bio,
            contactNumber: user.contactNumber,
            socialLinks: user.socialLinks,
            created_at: user.created_at,
            updated_at: user.updated_at
          }
        }
      });

    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile',
        error: error.message
      });
    }
  }

  // @desc    Update current user profile
  // @access  Private
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { first_name, last_name, email, bio, contactNumber, socialLinks } = req.body;
      
      const updateData: any = {};
      if (first_name) updateData.first_name = first_name.trim();
      if (last_name) updateData.last_name = last_name.trim();
      if (email) updateData.email = email.trim();
      if (bio !== undefined) updateData.bio = bio.trim();
      if (contactNumber !== undefined) updateData.contactNumber = contactNumber.trim();
      if (socialLinks) updateData.socialLinks = socialLinks;

      const user = await User.findByIdAndUpdate(
        (req as any).user._id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password_hash');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Get user roles
      const userRoles = await UserRole.find({ user_id: user._id }).populate('role_id');
      const roles = userRoles.map((ur: any) => ur.role_id.name);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: user._id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          status: user.status,
          roles: roles,
          bio: user.bio,
          contactNumber: user.contactNumber,
          socialLinks: user.socialLinks
        }
      });

    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  }

  // @desc    Get all users (Admin only)
  // @access  Private (Admin)
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '10', status, search } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      
      const query: any = {};
      
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
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .sort({ created_at: -1 });

      const total = await User.countDocuments(query);

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        users.map(async (user) => {
          const userRoles = await UserRole.find({ user_id: user._id }).populate('role_id');
          const roles = userRoles.map((ur: any) => ur.role_id.name);
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
            current_page: pageNum,
            total_pages: Math.ceil(total / limitNum),
            total_users: total,
            per_page: limitNum
          }
        }
      });

    } catch (error: any) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users',
        error: error.message
      });
    }
  }

  // @desc    Get user by ID (Admin only)
  // @access  Private (Admin)
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.params.id)
        .select('-password_hash');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Get user roles
      const userRoles = await UserRole.find({ user_id: user._id }).populate('role_id');
      const roles = userRoles.map((ur: any) => ur.role_id.name);

      res.json({
        success: true,
        data: {
          user: {
            ...user.toObject(),
            roles
          }
        }
      });

    } catch (error: any) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user',
        error: error.message
      });
    }
  }

  // @desc    Update user status (Admin only)
  // @access  Private (Admin)
  static async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.body;
      
      if (!['pending_verification', 'active', 'suspended', 'deleted'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
        return;
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
      ).select('-password_hash');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Log audit event
      const action = status === 'suspended' ? 'SUSPEND_USER' : 'REACTIVATE_USER';
      await AuditLog.create({
        user_id: (req as any).user._id,
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

    } catch (error: any) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status',
        error: error.message
      });
    }
  }

  // @desc    Assign role to user (Admin only)
  // @access  Private (Admin)
  static async assignRole(req: Request, res: Response): Promise<void> {
    try {
      const { role_id } = req.body;
      const user_id = req.params.id;

      // Check if user exists
      const user = await User.findById(user_id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Check if role exists
      const role = await Role.findById(role_id);
      if (!role) {
        res.status(404).json({
          success: false,
          message: 'Role not found'
        });
        return;
      }

      // Check if user already has this role
      const existingUserRole = await UserRole.findOne({ user_id, role_id });
      if (existingUserRole) {
        res.status(400).json({
          success: false,
          message: 'User already has this role'
        });
        return;
      }

      // Assign role
      await UserRole.create({ user_id, role_id });

      // Log audit event
      await AuditLog.create({
        user_id: (req as any).user._id,
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

    } catch (error: any) {
      console.error('Assign role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign role',
        error: error.message
      });
    }
  }

  // @desc    Remove role from user (Admin only)
  // @access  Private (Admin)
  static async removeRole(req: Request, res: Response): Promise<void> {
    try {
      const { id: user_id, roleId: role_id } = req.params;

      // Check if user exists
      const user = await User.findById(user_id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Check if role exists
      const role = await Role.findById(role_id);
      if (!role) {
        res.status(404).json({
          success: false,
          message: 'Role not found'
        });
        return;
      }

      // Remove role
      const userRole = await UserRole.findOneAndDelete({ user_id, role_id });
      if (!userRole) {
        res.status(404).json({
          success: false,
          message: 'User does not have this role'
        });
        return;
      }

      // Log audit event
      await AuditLog.create({
        user_id: (req as any).user._id,
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

    } catch (error: any) {
      console.error('Remove role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove role',
        error: error.message
      });
    }
  }
}
