const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { User, Campus, Session, EmailVerification, PasswordReset, AuditLog, UserRole, Role } = require('../models');
const { 
  validateUserRegistration, 
  validateUserLogin, 
  validatePasswordResetRequest,
  validatePasswordReset,
  validateEmailVerification 
} = require('../middleware/validation');
const { loginRateLimit, logLoginAttempt } = require('../middleware/rateLimiting');
const { authenticateToken, verifyRefreshToken } = require('../middleware/auth');

const router = express.Router();

// Helper function to generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    { expiresIn: '15m' }
  );
  
  const refreshToken = uuidv4();
  
  return { accessToken, refreshToken };
};

// Helper function to send verification email (mock implementation)
const sendVerificationEmail = async (user, token) => {
  // In a real implementation, you would use nodemailer or similar
  console.log(`Verification email sent to ${user.email} with token: ${token}`);
  return true;
};

// Helper function to send password reset email (mock implementation)
const sendPasswordResetEmail = async (user, token) => {
  // In a real implementation, you would use nodemailer or similar
  console.log(`Password reset email sent to ${user.email} with token: ${token}`);
  return true;
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { email, password, first_name, last_name, campus_id } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Verify campus exists
    const campus = await Campus.findById(campus_id);
    if (!campus) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campus ID'
      });
    }

    // Verify email domain matches campus
    const emailDomain = email.split('@')[1];
    if (emailDomain !== campus.email_domain) {
      return res.status(400).json({
        success: false,
        message: 'Email domain does not match campus domain'
      });
    }

    // Create user
    const user = new User({
      campus_id,
      email,
      password_hash: password, // Will be hashed by pre-save middleware
      first_name,
      last_name
    });

    await user.save();

    // Assign default buyer role
    const buyerRole = await Role.findOne({ name: 'buyer' });
    if (buyerRole) {
      await UserRole.create({
        user_id: user._id,
        role_id: buyerRole._id
      });
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    
    await EmailVerification.create({
      user_id: user._id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Send verification email
    await sendVerificationEmail(user, verificationToken);

    // Log audit event
    await AuditLog.create({
      user_id: user._id,
      action: 'SIGN_UP',
      metadata: { email, campus_id }
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          status: user.status
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify user email
// @access  Public
router.post('/verify-email', validateEmailVerification, async (req, res) => {
  try {
    const { token } = req.body;
    
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const verification = await EmailVerification.findOne({
      token_hash: tokenHash
    }).populate('user_id');

    if (!verification || !verification.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Update user status
    await User.findByIdAndUpdate(verification.user_id._id, {
      status: 'active',
      email_verified_at: new Date()
    });

    // Mark token as used
    verification.used_at = new Date();
    await verification.save();

    // Log audit event
    await AuditLog.create({
      user_id: verification.user_id._id,
      action: 'VERIFY_EMAIL',
      metadata: { email: verification.user_id.email }
    });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: error.message
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, loginRateLimit, logLoginAttempt, async (req, res) => {
  try {
    const { email, password } = req.body;
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Find user
    const user = await User.findOne({ email }).populate('campus_id');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active. Please verify your email or contact support.'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Create session
    await Session.create({
      user_id: user._id,
      refresh_token: refreshToken,
      user_agent: userAgent,
      ip_address: ipAddress,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Get user roles
    const userRoles = await UserRole.find({ user_id: user._id }).populate('role_id');
    const roles = userRoles.map(ur => ur.role_id.name);

    // Log audit event
    await AuditLog.create({
      user_id: user._id,
      action: 'LOGIN',
      metadata: { ip_address: ipAddress, user_agent: userAgent }
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          status: user.status,
          campus: user.campus_id,
          roles: roles
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', verifyRefreshToken, async (req, res) => {
  try {
    const { session, user } = req;

    // Generate new access token
    const { accessToken } = generateTokens(user._id);

    // Log audit event
    await AuditLog.create({
      user_id: user._id,
      action: 'REFRESH',
      metadata: { session_id: session._id }
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: error.message
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke the specific session
      await Session.findOneAndUpdate(
        { refresh_token: refreshToken },
        { revoked_at: new Date() }
      );
    }

    // Log audit event
    await AuditLog.create({
      user_id: req.user._id,
      action: 'LOGOUT',
      metadata: { refresh_token_provided: !!refreshToken }
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', validatePasswordResetRequest, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    await PasswordReset.create({
      user_id: user._id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    // Send reset email
    await sendPasswordResetEmail(user, resetToken);

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset request failed',
      error: error.message
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', validatePasswordReset, async (req, res) => {
  try {
    const { token, password } = req.body;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRequest = await PasswordReset.findOne({
      token_hash: tokenHash
    }).populate('user_id');

    if (!resetRequest || !resetRequest.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update user password
    const user = resetRequest.user_id;
    user.password_hash = password; // Will be hashed by pre-save middleware
    await user.save();

    // Mark token as used
    resetRequest.used_at = new Date();
    await resetRequest.save();

    // Revoke all existing sessions
    await Session.updateMany(
      { user_id: user._id },
      { revoked_at: new Date() }
    );

    // Log audit event
    await AuditLog.create({
      user_id: user._id,
      action: 'RESET_PASSWORD',
      metadata: { email: user.email }
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: error.message
    });
  }
});

module.exports = router;
