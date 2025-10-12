import express from 'express';
import { AuthHandlers } from '../handlers/authHandlers.js';
import { 
  validateUserRegistration, 
  validateUserLogin, 
  validatePasswordResetRequest,
  validatePasswordReset,
  validateEmailVerification 
} from '../middleware/validation.js';
import { loginRateLimit, logLoginAttempt } from '../middleware/rateLimiting.js';
import { authenticateToken, verifyRefreshToken } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateUserRegistration, AuthHandlers.register);

// @route   POST /api/auth/verify-email
// @desc    Verify user email
// @access  Public
router.post('/verify-email', validateEmailVerification, AuthHandlers.verifyEmail);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, loginRateLimit, logLoginAttempt, AuthHandlers.login);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', verifyRefreshToken, AuthHandlers.refresh);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, AuthHandlers.logout);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', validatePasswordResetRequest, AuthHandlers.forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', validatePasswordReset, AuthHandlers.resetPassword);

export default router;

