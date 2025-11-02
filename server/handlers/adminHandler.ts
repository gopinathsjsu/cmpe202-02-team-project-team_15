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
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import mongoose, { SortOrder, Types } from 'mongoose';

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
        .populate({ path: 'listingId', select: 'title listingId' })
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
}
