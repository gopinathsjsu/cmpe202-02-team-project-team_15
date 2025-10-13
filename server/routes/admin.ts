const express = require('express');

// Get models dynamically to avoid ES module issues
let models: any = null;

const getModels = async () => {
  if (!models) {
    const { getModels: getModelsFunc } = require('../models/index');
    models = await getModelsFunc();
  }
  return models;
};

const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/audit-logs
// @desc    Get audit logs (Admin only)
// @access  Private (Admin)
router.get('/audit-logs', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      user_id, 
      action, 
      start_date, 
      end_date 
    } = req.query;

    const query: any = {};
    
    if (user_id) query.user_id = user_id;
    if (action) query.action = action;
    
    if (start_date || end_date) {
      query.created_at = {};
      if (start_date) query.created_at.$gte = new Date(start_date);
      if (end_date) query.created_at.$lte = new Date(end_date);
    }

    const { AuditLog } = await getModels();
    const auditLogs = await AuditLog.find(query)
      .populate('user_id', 'email first_name last_name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ created_at: -1 });

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        audit_logs: auditLogs,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_logs: total,
          per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get audit logs',
      error: error.message
    });
  }
});

// @route   GET /api/admin/login-attempts
// @desc    Get login attempts (Admin only)
// @access  Private (Admin)
router.get('/login-attempts', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      email, 
      ip_address, 
      success, 
      start_date, 
      end_date 
    } = req.query;

    const query: any = {};
    
    if (email) query.email = { $regex: email, $options: 'i' };
    if (ip_address) query.ip_address = ip_address;
    if (success !== undefined) query.success = success === 'true';
    
    if (start_date || end_date) {
      query.created_at = {};
      if (start_date) query.created_at.$gte = new Date(start_date);
      if (end_date) query.created_at.$lte = new Date(end_date);
    }

    const { LoginAttempt } = await getModels();
    const loginAttempts = await LoginAttempt.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ created_at: -1 });

    const total = await LoginAttempt.countDocuments(query);

    res.json({
      success: true,
      data: {
        login_attempts: loginAttempts,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_attempts: total,
          per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get login attempts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get login attempts',
      error: error.message
    });
  }
});

// @route   GET /api/admin/sessions
// @desc    Get active sessions (Admin only)
// @access  Private (Admin)
router.get('/sessions', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 50, user_id } = req.query;
    const { Session } = await getModels();

    const query: any = { 
      revoked_at: null,
      expires_at: { $gt: new Date() }
    };
    
    if (user_id) query.user_id = user_id;

    const sessions = await Session.find(query)
      .populate('user_id', 'email first_name last_name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ created_at: -1 });

    const total = await Session.countDocuments(query);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_sessions: total,
          per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sessions',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/sessions/:id
// @desc    Revoke session (Admin only)
// @access  Private (Admin)
router.delete('/sessions/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { Session } = await getModels();
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.revoked_at = new Date();
    await session.save();

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });

  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke session',
      error: error.message
    });
  }
});

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics (Admin only)
// @access  Private (Admin)
router.get('/dashboard', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const { User, Campus, Session, LoginAttempt } = await getModels();

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
    const { AuditLog } = await getModels();
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

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
});

// @route   POST /api/admin/cleanup
// @desc    Cleanup expired tokens and sessions (Admin only)
// @access  Private (Admin)
router.post('/cleanup', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const now = new Date();
    const { Session, EmailVerification, PasswordReset, LoginAttempt } = await getModels();

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

  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Cleanup failed',
      error: error.message
    });
  }
});

module.exports = router;

export {};

