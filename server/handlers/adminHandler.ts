import { Request, Response } from 'express';
import { User } from '../models/User';
import { Campus } from '../models/Campus';
import { Session } from '../models/Session';
import { LoginAttempt } from '../models/LoginAttempt';
import { AuditLog } from '../models/AuditLog';
import { EmailVerification } from '../models/EmailVerification';
import { PasswordReset } from '../models/PasswordReset';
import { Report } from '../models/Report';
import Listing from '../models/Listing';
import Category from '../models/Category';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import mongoose, { SortOrder, Types } from 'mongoose';
import { sendAccountSuspensionEmail, sendAccountUnsuspensionEmail } from '../services/emailService';

export class AdminHandler {
  // @desc    Get audit logs (Admin only)
  // @access  Private (Admin)
  static async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { 
        page = '1', 
        limit = '50', 
        user_id, 
        action, 
        start_date, 
        end_date 
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const query: any = {};
      
      if (user_id) query.user_id = user_id;
      if (action) query.action = action;
      
      if (start_date || end_date) {
        query.created_at = {};
        if (start_date) query.created_at.$gte = new Date(start_date as string);
        if (end_date) query.created_at.$lte = new Date(end_date as string);
      }

      const auditLogs = await AuditLog.find(query)
        .populate('user_id', 'email first_name last_name')
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .sort({ created_at: -1 });

      const total = await AuditLog.countDocuments(query);

      res.json({
        success: true,
        data: {
          audit_logs: auditLogs,
          pagination: {
            current_page: pageNum,
            total_pages: Math.ceil(total / limitNum),
            total_logs: total,
            per_page: limitNum
          }
        }
      });

    } catch (error: any) {
      console.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get audit logs',
        error: error.message
      });
    }
  }

  // @desc    Get login attempts (Admin only)
  // @access  Private (Admin)
  static async getLoginAttempts(req: Request, res: Response): Promise<void> {
    try {
      const { 
        page = '1', 
        limit = '50', 
        email, 
        ip_address, 
        success, 
        start_date, 
        end_date 
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const query: any = {};
      
      if (email) query.email = { $regex: email, $options: 'i' };
      if (ip_address) query.ip_address = ip_address;
      if (success !== undefined) query.success = success === 'true';
      
      if (start_date || end_date) {
        query.created_at = {};
        if (start_date) query.created_at.$gte = new Date(start_date as string);
        if (end_date) query.created_at.$lte = new Date(end_date as string);
      }

      const loginAttempts = await LoginAttempt.find(query)
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .sort({ created_at: -1 });

      const total = await LoginAttempt.countDocuments(query);

      res.json({
        success: true,
        data: {
          login_attempts: loginAttempts,
          pagination: {
            current_page: pageNum,
            total_pages: Math.ceil(total / limitNum),
            total_attempts: total,
            per_page: limitNum
          }
        }
      });

    } catch (error: any) {
      console.error('Get login attempts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get login attempts',
        error: error.message
      });
    }
  }

  // @desc    Get active sessions (Admin only)
  // @access  Private (Admin)
  static async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '50', user_id } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const query: any = { 
        revoked_at: null,
        expires_at: { $gt: new Date() }
      };
      
      if (user_id) query.user_id = user_id;

      const sessions = await Session.find(query)
        .populate('user_id', 'email first_name last_name')
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .sort({ created_at: -1 });

      const total = await Session.countDocuments(query);

      res.json({
        success: true,
        data: {
          sessions,
          pagination: {
            current_page: pageNum,
            total_pages: Math.ceil(total / limitNum),
            total_sessions: total,
            per_page: limitNum
          }
        }
      });

    } catch (error: any) {
      console.error('Get sessions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get sessions',
        error: error.message
      });
    }
  }

  // @desc    Revoke session (Admin only)
  // @access  Private (Admin)
  static async revokeSession(req: Request, res: Response): Promise<void> {
    try {
      const session = await Session.findById(req.params.id);
      
      if (!session) {
        res.status(404).json({
          success: false,
          message: 'Session not found'
        });
        return;
      }

      session.revoked_at = new Date();
      await session.save();

      res.json({
        success: true,
        message: 'Session revoked successfully'
      });

    } catch (error: any) {
      console.error('Revoke session error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to revoke session',
        error: error.message
      });
    }
  }

  // @desc    Get admin dashboard statistics (Admin only)
  // @access  Private (Admin)
  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // User statistics
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ status: 'active' });
      const pendingUsers = await User.countDocuments({ status: 'pending_verification' });
      const suspendedUsers = await User.countDocuments({ status: 'suspended' });
      
      const newUsers24h = await User.countDocuments({ 
        created_at: { $gte: last24Hours } 
      });
      const newUsers7d = await User.countDocuments({ 
        created_at: { $gte: last7Days } 
      });

      // Campus statistics
      const totalCampuses = await Campus.countDocuments();

      // Session statistics
      const activeSessions = await Session.countDocuments({
        revoked_at: null,
        expires_at: { $gt: now }
      });

      // Login attempt statistics
      const loginAttempts24h = await LoginAttempt.countDocuments({
        created_at: { $gte: last24Hours }
      });
      const successfulLogins24h = await LoginAttempt.countDocuments({
        created_at: { $gte: last24Hours },
        success: true
      });
      const failedLogins24h = loginAttempts24h - successfulLogins24h;

      // Recent audit activities
      const recentAuditLogs = await AuditLog.find()
        .populate('user_id', 'email first_name last_name')
        .limit(10)
        .sort({ created_at: -1 });

      // User growth over last 30 days
      const userGrowth = await User.aggregate([
        {
          $match: {
            created_at: { $gte: last30Days }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$created_at" }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      res.json({
        success: true,
        data: {
          statistics: {
            users: {
              total: totalUsers,
              active: activeUsers,
              pending: pendingUsers,
              suspended: suspendedUsers,
              new_24h: newUsers24h,
              new_7d: newUsers7d
            },
            campuses: {
              total: totalCampuses
            },
            sessions: {
              active: activeSessions
            },
            login_attempts: {
              total_24h: loginAttempts24h,
              successful_24h: successfulLogins24h,
              failed_24h: failedLogins24h,
              success_rate_24h: loginAttempts24h > 0 ? 
                ((successfulLogins24h / loginAttempts24h) * 100).toFixed(2) : 0
            }
          },
          recent_activities: recentAuditLogs,
          user_growth: userGrowth
        }
      });

    } catch (error: any) {
      console.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard data',
        error: error.message
      });
    }
  }

  // @desc    Cleanup expired tokens and sessions (Admin only)
  // @access  Private (Admin)
  static async cleanup(req: Request, res: Response): Promise<void> {
    try {
      const now = new Date();

      // Clean up expired sessions
      const expiredSessions = await Session.deleteMany({
        expires_at: { $lt: now }
      });

      // Clean up expired email verification tokens
      const expiredEmailTokens = await EmailVerification.deleteMany({
        expires_at: { $lt: now }
      });

      // Clean up expired password reset tokens
      const expiredPasswordTokens = await PasswordReset.deleteMany({
        expires_at: { $lt: now }
      });

      // Clean up old login attempts (older than 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const oldLoginAttempts = await LoginAttempt.deleteMany({
        created_at: { $lt: thirtyDaysAgo }
      });

      res.json({
        success: true,
        message: 'Cleanup completed successfully',
        data: {
          expired_sessions_deleted: expiredSessions.deletedCount,
          expired_email_tokens_deleted: expiredEmailTokens.deletedCount,
          expired_password_tokens_deleted: expiredPasswordTokens.deletedCount,
          old_login_attempts_deleted: oldLoginAttempts.deletedCount
        }
      });

    } catch (error: any) {
      console.error('Cleanup error:', error);
      res.status(500).json({
        success: false,
        message: 'Cleanup failed',
        error: error.message
      });
    }
  }

  // @desc Get reports with filters, search, pagination (Admin only)
  // @access Private (Admin)
  static async getReports(req: Request, res: Response): Promise<void> {
    try {
      const {
        status,
        category,
        from,
        to,
        q,
        page = '1',
        pageSize = '20',
        listingId,
        sort = 'desc'
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const pageSizeNum = parseInt(pageSize as string, 10);

      // Query builder
      const query: any = {};
      if (status) query.status = { $in: Array.isArray(status) ? status : [status] };
      if (category) query.reportCategory = { $in: Array.isArray(category) ? category : [category] };
      if (from || to) {
        query.createdAt = {};
        if (from) query.createdAt.$gte = new Date(from as string);
        if (to) query.createdAt.$lte = new Date(to as string);
      }
      if (listingId) {
        query.listingId = listingId;
      }

      // Build keyword search (title, listingId, user email/name)
      let listingIdsForTitle: any[] = [];
      let userIdsForSearch: any[] = [];
      if (q) {
        const qStr = String(q);
        // Listing title search
        const listings = await Listing.find({
          $or: [
            { title: { $regex: qStr, $options: 'i' } },
            { listingId: { $regex: qStr, $options: 'i' } }
          ]
        }, { _id: 1 });
        listingIdsForTitle = listings.map(l => l._id);
        // User (reporter/reported) search by email/name
        const users = await User.find({
          $or: [
            { email: { $regex: qStr, $options: 'i' } },
            { first_name: { $regex: qStr, $options: 'i' } },
            { last_name: { $regex: qStr, $options: 'i' } }
          ]
        }, { _id: 1 });
        userIdsForSearch = users.map(u => u._id);
      }
      if (q && (listingIdsForTitle.length > 0 || userIdsForSearch.length > 0)) {
        query.$or = [];
        if (listingIdsForTitle.length > 0) {
          query.$or.push({ listingId: { $in: listingIdsForTitle } });
        }
        if (userIdsForSearch.length > 0) {
          query.$or.push({
            $or: [
              { reporterId: { $in: userIdsForSearch } },
              { sellerId: { $in: userIdsForSearch } }
            ]
          });
        }
      } else if (q) {
        // Special case if nothing is found, return no results
        query.$or = [{ _id: null }]; // will return []
      }

      // Sorting
      const sortBy: SortOrder = sort === 'asc' ? 1 : -1;
      const sortObj: { [key: string]: SortOrder } = { createdAt: sortBy };

      // Query & paginate
      const total = await Report.countDocuments(query);
      const reports = await Report.find(query)
        .populate({ path: 'listingId', select: 'title listingId isHidden' })
        .populate({ path: 'reporterId', select: 'first_name last_name email' })
        .populate({ path: 'sellerId', select: 'first_name last_name email' })
        .sort(sortObj)
        .skip((pageNum - 1) * pageSizeNum)
        .limit(pageSizeNum);

      res.json({
        success: true,
        data: {
          reports,
          pagination: {
            current_page: pageNum,
            total_pages: Math.ceil(total / pageSizeNum),
            total_reports: total,
            per_page: pageSizeNum
          }
        }
      });
    } catch (error: any) {
      console.error('Get reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get reports',
        error: error.message
      });
    }
  }

  // @desc    Warn seller about listing violation (Admin only)
  // @access  Private (Admin)
  static async warnSeller(req: Request, res: Response): Promise<void> {
    try {
      const { listingId } = req.params;
      const { message: customMessage } = req.body as { message?: string };
      const adminId = String((req as any).user._id);

      // Validate listingId
      if (!listingId) {
        res.status(400).json({
          success: false,
          message: 'Listing ID is required'
        });
        return;
      }

      // Find the listing - support both MongoDB ObjectId and custom listingId format
      let listing;
      if (mongoose.Types.ObjectId.isValid(listingId)) {
        // Find by _id (MongoDB ObjectId)
        listing = await Listing.findById(listingId);
      } else if (listingId.match(/^LST-\d{8}-\d{4}$/)) {
        // Find by custom listingId format (LST-YYYYMMDD-XXXX)
        listing = await Listing.findOne({ listingId });
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid listing ID format. Expected MongoDB ObjectId or LST-YYYYMMDD-XXXX format'
        });
        return;
      }

      if (!listing) {
        res.status(404).json({
          success: false,
          message: 'Listing not found'
        });
        return;
      }

      const sellerId = String(listing.userId);

      // Check if admin is trying to warn themselves
      if (adminId === sellerId) {
        res.status(400).json({
          success: false,
          message: 'Cannot warn yourself'
        });
        return;
      }

      // Convert IDs to ObjectIds for the conversation query
      const listingObjectId = listing._id; // Already an ObjectId from the query
      const adminObjectId = new Types.ObjectId(adminId);
      const sellerObjectId = new Types.ObjectId(sellerId);

      // Create or find conversation between admin and seller for this listing
      // Admin acts as buyerId, seller is sellerId
      let conversation;
      try {
        conversation = await Conversation.findOneAndUpdate(
          { 
            listingId: listingObjectId, 
            buyerId: adminObjectId, 
            sellerId: sellerObjectId 
          },
          { 
            $setOnInsert: { 
              listingId: listingObjectId, 
              buyerId: adminObjectId, 
              sellerId: sellerObjectId 
            } 
          },
          { new: true, upsert: true }
        );
      } catch (error: any) {
        // If duplicate key error, the conversation should exist - try to find it
        if (error.code === 11000) {
          // Try to find the conversation for this specific listing
          // Duplicate key means it exists, so this should succeed
          conversation = await Conversation.findOne({
            listingId: listingObjectId,
            buyerId: adminObjectId,
            sellerId: sellerObjectId
          });
          
          if (!conversation) {
            // This shouldn't happen - duplicate key means conversation exists
            // But if it does, it's likely an index conflict issue
            console.error('Duplicate key error but conversation not found - index issue:', error.message);
            res.status(500).json({
              success: false,
              message: 'Database index conflict. Please contact administrator to remove old productId index.',
              error: 'Duplicate key error - conversation should exist but was not found'
            });
            return;
          }
          // Conversation found - we'll use it to send the warning message
        } else {
          throw error;
        }
      }

      // Create default warning message if custom message not provided
      const defaultMessage = `⚠️ WARNING: Your listing "${listing.title}" has been flagged for violating marketplace rules. Please review and update your listing to comply with our guidelines.`;
      const warningMessage = customMessage?.trim() || defaultMessage;

      // Create the warning message
      const message = await Message.create({
        conversationId: conversation._id,
        senderId: adminId,
        body: warningMessage,
        readBy: [adminId], // Admin has read it, seller hasn't yet
      });

      // Update conversation last message timestamp
      conversation.lastMessageAt = new Date();
      await conversation.save();

      res.status(201).json({
        success: true,
        message: 'Warning sent successfully',
        data: {
          conversation: {
            _id: conversation._id,
            listingId: conversation.listingId,
            buyerId: conversation.buyerId,
            sellerId: conversation.sellerId
          },
          message: {
            _id: message._id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            body: message.body,
            createdAt: message.createdAt
          }
        }
      });

    } catch (error: any) {
      console.error('Warn seller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send warning',
        error: error.message
      });
    }
  }

  // @desc    Get all categories (Admin only)
  // @access  Private (Admin)
  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '50' } = req.query;
      
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const categories = await Category.find()
        .sort({ name: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      const total = await Category.countDocuments();

      // Get listing count for each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const listingCount = await Listing.countDocuments({ categoryId: category._id });
          return {
            ...category.toObject(),
            listingCount
          };
        })
      );

      res.json({
        success: true,
        data: {
          categories: categoriesWithCount,
          pagination: {
            current_page: pageNum,
            total_pages: Math.ceil(total / limitNum),
            total_categories: total,
            per_page: limitNum
          }
        }
      });

    } catch (error: any) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get categories',
        error: error.message
      });
    }
  }

  // @desc    Create new category (Admin only)
  // @access  Private (Admin)
  static async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;

      // Validate required fields
      if (!name || !name.trim()) {
        res.status(400).json({
          success: false,
          message: 'Category name is required'
        });
        return;
      }

      // Check if category already exists
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
      });

      if (existingCategory) {
        res.status(400).json({
          success: false,
          message: 'Category already exists with this name'
        });
        return;
      }

      // Create new category
      const category = new Category({
        name: name.trim(),
        description: description?.trim() || ''
      });

      await category.save();

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { category }
      });

    } catch (error: any) {
      console.error('Create category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create category',
        error: error.message
      });
    }
  }

  // @desc    Update category (Admin only)
  // @access  Private (Admin)
  static async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Validate category ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
        return;
      }

      // Find category
      const category = await Category.findById(id);
      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Category not found'
        });
        return;
      }

      // If name is being updated, check for duplicates
      if (name && name.trim() !== category.name) {
        const existingCategory = await Category.findOne({
          name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
          _id: { $ne: id }
        });

        if (existingCategory) {
          res.status(400).json({
            success: false,
            message: 'Another category already exists with this name'
          });
          return;
        }

        category.name = name.trim();
      }

      // Update description if provided
      if (description !== undefined) {
        category.description = description.trim();
      }

      await category.save();

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: { category }
      });

    } catch (error: any) {
      console.error('Update category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update category',
        error: error.message
      });
    }
  }

  // @desc    Delete category (Admin only)
  // @access  Private (Admin)
  static async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate category ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
        return;
      }

      // Check if category exists
      const category = await Category.findById(id);
      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Category not found'
        });
        return;
      }

      // Check if any listings use this category
      const listingCount = await Listing.countDocuments({ categoryId: id });
      if (listingCount > 0) {
        res.status(400).json({
          success: false,
          message: `Cannot delete category. ${listingCount} listing(s) are using this category. Please reassign or delete those listings first.`,
          data: {
            listingCount
          }
        });
        return;
      }

      // Delete the category
      await Category.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Category deleted successfully',
        data: { 
          deletedCategory: category 
        }
      });

    } catch (error: any) {
      console.error('Delete category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete category',
        error: error.message
      });
    }
  }

  // @desc    Update listing category (Admin only)
  // @access  Private (Admin)
  static async updateListingCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { categoryId } = req.body;

      // Validate listing ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid listing ID'
        });
        return;
      }

      // Validate category ID
      if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
        return;
      }

      // Check if category exists
      const category = await Category.findById(categoryId);
      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Category not found'
        });
        return;
      }

      // Update listing category
      const listing = await Listing.findByIdAndUpdate(
        id,
        { categoryId, updatedAt: new Date() },
        { new: true }
      ).populate([
        { path: 'categoryId', select: 'name description' },
        { path: 'userId', select: 'first_name last_name email' }
      ]);

      if (!listing) {
        res.status(404).json({
          success: false,
          message: 'Listing not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Listing category updated successfully',
        data: { listing }
      });

    } catch (error: any) {
      console.error('Update listing category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update listing category',
        error: error.message
      });
    }
  }

  // @desc    Hide or restore a listing (Admin only)
  // @access  Private (Admin)
  static async toggleListingVisibility(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isHidden } = req.body;

      // Validate listing ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid listing ID'
        });
        return;
      }

      // Validate isHidden parameter
      if (typeof isHidden !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'isHidden must be a boolean value'
        });
        return;
      }

      // Find and update the listing
      const listing = await Listing.findByIdAndUpdate(
        id,
        { isHidden },
        { new: true }
      ).populate('userId', 'first_name last_name email')
       .populate('categoryId', 'name');

      if (!listing) {
        res.status(404).json({
          success: false,
          message: 'Listing not found'
        });
        return;
      }

      res.json({
        success: true,
        message: `Listing ${isHidden ? 'hidden' : 'restored'} successfully`,
        data: { listing }
      });

    } catch (error: any) {
      console.error('Toggle listing visibility error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle listing visibility',
        error: error.message
      });
    }
  }

  // @desc    Suspend user account (Admin only)
  // @access  Private (Admin)
  static async suspendUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason, listingId } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const user = await User.findById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Don't allow suspending admin users
      const adminRole = await mongoose.model('Role').findOne({ name: 'admin' });
      const userRoles = await mongoose.model('UserRole').find({ user_id: id });
      const isAdmin = userRoles.some((ur: any) => ur.role_id.toString() === adminRole?._id.toString());

      if (isAdmin) {
        res.status(403).json({
          success: false,
          message: 'Cannot suspend admin users'
        });
        return;
      }

      // Update user status to suspended
      user.status = 'suspended';
      await user.save();

      // Hide all listings by this user
      await Listing.updateMany(
        { userId: id },
        { isHidden: true }
      );

      // Create audit log
      await AuditLog.create({
        user_id: (req as any).user?.userId,
        action: 'SUSPEND_USER',
        details: `Suspended user ${user.email}. Reason: ${reason || 'No reason provided'}. All user listings hidden.`,
        ip_address: req.ip
      });

      // Revoke all active sessions for this user
      await Session.updateMany(
        { user_id: id, revoked_at: null },
        { revoked_at: new Date() }
      );

      // Send suspension email notification to the user
      try {
        const emailSent = await sendAccountSuspensionEmail(
          user.email,
          user.first_name,
          user.last_name,
          reason
        );
        
        if (emailSent) {
          console.log(`Suspension notification email sent to ${user.email}`);
        } else {
          console.warn(`Failed to send suspension notification email to ${user.email}`);
        }
      } catch (emailError: any) {
        // Log error but don't fail the suspension operation
        console.error('Error sending suspension email:', emailError.message);
      }

      res.json({
        success: true,
        message: 'User account suspended successfully',
        data: {
          user: {
            _id: user._id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            status: user.status
          }
        }
      });

    } catch (error: any) {
      console.error('Suspend user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to suspend user',
        error: error.message
      });
    }
  }

  // @desc    Delete user account (Admin only)
  // @access  Private (Admin)
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const user = await User.findById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Don't allow deleting admin users
      const adminRole = await mongoose.model('Role').findOne({ name: 'admin' });
      const userRoles = await mongoose.model('UserRole').find({ user_id: id });
      const isAdmin = userRoles.some((ur: any) => ur.role_id.toString() === adminRole?._id.toString());

      if (isAdmin) {
        res.status(403).json({
          success: false,
          message: 'Cannot delete admin users'
        });
        return;
      }

      // Update user status to deleted (soft delete)
      user.status = 'deleted';
      await user.save();

      // Create audit log
      await AuditLog.create({
        user_id: (req as any).user?.userId,
        action: 'DELETE_USER',
        details: `Deleted user ${user.email}. Reason: ${reason || 'No reason provided'}`,
        ip_address: req.ip
      });

      // Revoke all active sessions for this user
      await Session.updateMany(
        { user_id: id, revoked_at: null },
        { revoked_at: new Date() }
      );

      // Hide all listings by this user
      await Listing.updateMany(
        { userId: id },
        { isHidden: true }
      );

      res.json({
        success: true,
        message: 'User account deleted successfully',
        data: {
          user: {
            _id: user._id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            status: user.status
          }
        }
      });

    } catch (error: any) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }
  }

  // @desc    Get all suspended users (Admin only)
  // @access  Private (Admin)
  static async getSuspendedUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '20' } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const suspendedUsers = await User.find({ status: 'suspended' })
        .select('first_name last_name email status created_at updated_at')
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .sort({ updated_at: -1 });

      const total = await User.countDocuments({ status: 'suspended' });

      res.json({
        success: true,
        data: {
          users: suspendedUsers,
          pagination: {
            current_page: pageNum,
            total_pages: Math.ceil(total / limitNum),
            total_users: total,
            per_page: limitNum
          }
        }
      });

    } catch (error: any) {
      console.error('Get suspended users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get suspended users',
        error: error.message
      });
    }
  }

  // @desc    Unsuspend user account (restore to active) (Admin only)
  // @access  Private (Admin)
  static async unsuspendUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
        return;
      }

      const user = await User.findById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      if (user.status !== 'suspended') {
        res.status(400).json({
          success: false,
          message: 'User is not suspended'
        });
        return;
      }

      // Update user status to active
      user.status = 'active';
      await user.save();

      // Restore (unhide) all listings by this user
      await Listing.updateMany(
        { userId: id },
        { isHidden: false }
      );

      // Create audit log
      await AuditLog.create({
        user_id: (req as any).user?.userId,
        action: 'REACTIVATE_USER',
        details: `Unsuspended user ${user.email}. All listings restored.`,
        ip_address: req.ip
      });

      // Send unsuspension email notification to the user
      try {
        const emailSent = await sendAccountUnsuspensionEmail(
          user.email,
          user.first_name,
          user.last_name
        );
        
        if (emailSent) {
          console.log(`Unsuspension notification email sent to ${user.email}`);
        } else {
          console.warn(`Failed to send unsuspension notification email to ${user.email}`);
        }
      } catch (emailError: any) {
        // Log error but don't fail the unsuspension operation
        console.error('Error sending unsuspension email:', emailError.message);
      }

      res.json({
        success: true,
        message: 'User account unsuspended successfully',
        data: {
          user: {
            _id: user._id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            status: user.status
          }
        }
      });

    } catch (error: any) {
      console.error('Unsuspend user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unsuspend user',
        error: error.message
      });
    }
  }
}
