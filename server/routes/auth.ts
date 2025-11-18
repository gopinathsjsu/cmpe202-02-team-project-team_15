import express from 'express';
import { AuthHandler } from '../handlers/authHandler';

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

// @route   GET /api/auth/check-verification/:email
// @desc    Check if email is verified
// @access  Public
router.get('/check-verification/:email', AuthHandler.checkVerification);

// @route   POST /api/auth/request-verification
// @desc    Request email verification (send code + link)
// @access  Public
router.post('/request-verification', AuthHandler.requestVerification);

// @route   POST /api/auth/verify-code
// @desc    Verify email using verification code
// @access  Public
router.post('/verify-code', AuthHandler.verifyCode);

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email using verification link (secure token from email)
// @access  Public
router.get('/verify-email/:token', AuthHandler.verifyEmailLink);

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateUserRegistration, AuthHandler.register);

router.post('/signup', AuthHandler.register);


// @route   POST /api/auth/verify-email
// @desc    Verify user email (legacy endpoint)
// @access  Public
router.post('/verify-email', validateEmailVerification, AuthHandler.verifyEmail);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, loginRateLimit, logLoginAttempt, AuthHandler.login);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', verifyRefreshToken, AuthHandler.refresh);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, AuthHandler.logout);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', validatePasswordResetRequest, AuthHandler.forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', validatePasswordReset, AuthHandler.resetPassword);

export default router;

