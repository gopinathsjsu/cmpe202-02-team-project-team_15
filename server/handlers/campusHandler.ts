import { Request, Response } from 'express';
import { Campus } from '../models/Campus';
import { User } from '../models/User';

export class CampusHandler {
  // @desc    Get all campuses
  // @access  Public
  static async getAllCampuses(req: Request, res: Response): Promise<void> {
    try {
      const campuses = await Campus.find().sort({ name: 1 });

      res.json({
        success: true,
        data: { campuses }
      });

    } catch (error: any) {
      console.error('Get campuses error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get campuses',
        error: error.message
      });
    }
  }

  // @desc    Get campus by ID
  // @access  Public
  static async getCampusById(req: Request, res: Response): Promise<void> {
    try {
      const campus = await Campus.findById(req.params.id);

      if (!campus) {
        res.status(404).json({
          success: false,
          message: 'Campus not found'
        });
        return;
      }

      res.json({
        success: true,
        data: { campus }
      });

    } catch (error: any) {
      console.error('Get campus error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get campus',
        error: error.message
      });
    }
  }

  // @desc    Create new campus (Admin only)
  // @access  Private (Admin)
  static async createCampus(req: Request, res: Response): Promise<void> {
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
        res.status(400).json({
          success: false,
          message: 'Campus with this name or email domain already exists'
        });
        return;
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

    } catch (error: any) {
      console.error('Create campus error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create campus',
        error: error.message
      });
    }
  }

  // @desc    Update campus (Admin only)
  // @access  Private (Admin)
  static async updateCampus(req: Request, res: Response): Promise<void> {
    try {
      const { name, email_domain } = req.body;

      const campus = await Campus.findById(req.params.id);
      if (!campus) {
        res.status(404).json({
          success: false,
          message: 'Campus not found'
        });
        return;
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
        res.status(400).json({
          success: false,
          message: 'Another campus with this name or email domain already exists'
        });
        return;
      }

      const updateData: any = {};
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

    } catch (error: any) {
      console.error('Update campus error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update campus',
        error: error.message
      });
    }
  }

  // @desc    Delete campus (Admin only)
  // @access  Private (Admin)
  static async deleteCampus(req: Request, res: Response): Promise<void> {
    try {
      const campus = await Campus.findById(req.params.id);
      if (!campus) {
        res.status(404).json({
          success: false,
          message: 'Campus not found'
        });
        return;
      }

      // Note: Since we removed campus_id from users, we can delete campus without checking user associations

      await Campus.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: 'Campus deleted successfully'
      });

    } catch (error: any) {
      console.error('Delete campus error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete campus',
        error: error.message
      });
    }
  }

  // @desc    Get users by campus (Admin only)
  // @access  Private (Admin)
  static async getCampusUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '10', status } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      
      const campus = await Campus.findById(req.params.id);
      if (!campus) {
        res.status(404).json({
          success: false,
          message: 'Campus not found'
        });
        return;
      }

      // Note: Since we removed campus_id from users, this endpoint is no longer relevant
      // Return empty result or consider removing this endpoint entirely
      const query: any = {};
      if (status) query.status = status;

      const users = await User.find(query)
        .select('-password_hash')
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .sort({ created_at: -1 });

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: {
          campus,
          users,
          pagination: {
            current_page: pageNum,
            total_pages: Math.ceil(total / limitNum),
            total_users: total,
            per_page: limitNum
          }
        }
      });

    } catch (error: any) {
      console.error('Get campus users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get campus users',
        error: error.message
      });
    }
  }
}
