import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AdminHandler
 } from '../handlers/adminHandler';

const router = express.Router();

// @route   GET /api/admin/audit-logs
// @desc    Get audit logs (Admin only)
// @access  Private (Admin)
router.get('/audit-logs', authenticateToken, requireRole(['admin']), AdminHandler
.getAuditLogs);

// @route   GET /api/admin/login-attempts
// @desc    Get login attempts (Admin only)
// @access  Private (Admin)
router.get('/login-attempts', authenticateToken, requireRole(['admin']), AdminHandler
.getLoginAttempts);

// @route   GET /api/admin/sessions
// @desc    Get active sessions (Admin only)
// @access  Private (Admin)
router.get('/sessions', authenticateToken, requireRole(['admin']), AdminHandler
.getSessions);

// @route   DELETE /api/admin/sessions/:id
// @desc    Revoke session (Admin only)
// @access  Private (Admin)
router.delete('/sessions/:id', authenticateToken, requireRole(['admin']), AdminHandler
.revokeSession);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics (Admin only)
// @access  Private (Admin)
router.get('/dashboard', authenticateToken, requireRole(['admin']), AdminHandler
.getDashboard);

// @route   POST /api/admin/cleanup
// @desc    Cleanup expired tokens and sessions (Admin only)
// @access  Private (Admin)
router.post('/cleanup', authenticateToken, requireRole(['admin']), AdminHandler
.cleanup);

export default router;