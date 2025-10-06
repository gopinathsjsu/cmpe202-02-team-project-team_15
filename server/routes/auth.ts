import express from 'express';
import { AuthController } from '../controllers/authController';
import { 
  validateUserRegistration, 
  validateUserLogin, 
  validatePasswordResetRequest,
  validatePasswordReset,
  validateEmailVerification 
} from '../middleware/validation';
import { loginRateLimit, logLoginAttempt } from '../middleware/rateLimiting';
import { authenticateToken, verifyRefreshToken } from '../middleware/auth';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateUserRegistration, AuthController.register);

// @route   POST /api/auth/verify-email
// @desc    Verify user email
// @access  Public
router.post('/verify-email', validateEmailVerification, AuthController.verifyEmail);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, loginRateLimit, logLoginAttempt, AuthController.login);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', verifyRefreshToken, AuthController.refresh);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, AuthController.logout);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', validatePasswordResetRequest, AuthController.forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', validatePasswordReset, AuthController.resetPassword);

export default router;
