const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { User, Session, EmailVerification, PasswordReset, AuditLog, UserRole, Role } = require('../models');

// Helper function to generate tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    { expiresIn: '15m' }
  );
  
  const refreshToken = uuidv4();
  
  return { accessToken, refreshToken };
};

// Helper function to send verification email (mock implementation)
const sendVerificationEmail = async (user: any, token: string): Promise<boolean> => {
  // In a real implementation, you would use nodemailer or similar
  console.log(`Verification email sent to ${user.email} with token: ${token}`);
  return true;
};

// Helper function to send password reset email (mock implementation)
const sendPasswordResetEmail = async (user: any, token: string): Promise<boolean> => {
  // In a real implementation, you would use nodemailer or similar
  console.log(`Password reset email sent to ${user.email} with token: ${token}`);
  return true;
};

class AuthHandler {
  // @route   POST /api/auth/register
  // @desc    Register a new user
  // @access  Public
  static async register(req, res) {
    try {
      console.log("=== SIGNUP REQUEST ===");
      console.log("Incoming signup data:", req.body);
      console.log("Request headers:", req.headers);
      console.log("Request origin:", req.get('Origin'));
      
      // Handle both field name formats (frontend sends firstName/lastName, backend expects first_name/last_name)
      const { email, password, first_name, last_name, firstName, lastName } = req.body;
      const finalFirstName = first_name || firstName;
      const finalLastName = last_name || lastName;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
        return;
      }

      // Verify email domain is .edu (for San Jose State University)
      const emailDomain = email.split('@')[1];
      if (!emailDomain.endsWith('.edu')) {
        res.status(400).json({
          success: false,
          message: 'Email must be from an educational institution (.edu domain)'
        });
        return;
      }

      // Create user with active status and verified email
      const user = new User({
        email,
        password_hash: password, // Will be hashed by pre-save middleware
        first_name: finalFirstName,
        last_name: finalLastName,
        status: 'active',
        email_verified_at: new Date()
      });

      try {
        await user.save();
        console.log("User saved successfully:", user._id);
      } catch (saveError) {
        console.error("Error saving user:", saveError);
        return res.status(400).json({ 
          success: false, 
          message: saveError.message || "Invalid signup data" 
        });
      }

      // Assign default user role
      const userRole = await Role.findOne({ name: 'user' });
      if (userRole) {
        await UserRole.create({
          user_id: user._id,
          role_id: userRole._id
        });
      }

      // User is automatically verified, no email verification needed

      // Log audit event
      await AuditLog.create({
        user_id: user._id,
        action: 'SIGN_UP',
        metadata: { email }
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Your account is now active and ready to use.',
        data: {
          user: {
            id: user._id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            status: user.status,
            email_verified_at: user.email_verified_at
          }
        }
      });

    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  }

  // @route   POST /api/auth/verify-email
  // @desc    Verify user email
  // @access  Public
  static async verifyEmail(req, res) {
    try {
      const { token } = req.body;
      
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      const verification = await EmailVerification.findOne({
        token_hash: tokenHash
      }).populate('user_id');

      if (!verification || !verification.isValid()) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
        return;
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

    } catch (error: any) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Email verification failed',
        error: error.message
      });
    }
  }

  // @route   POST /api/auth/login
  // @desc    Login user
  // @access  Public
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const userAgent = req.get('User-Agent') || '';
      const ipAddress = req.ip || req.connection.remoteAddress;

      console.log('[AuthController.login] Starting login for:', email);

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        console.log('[AuthController.login] User not found');
        res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
        return;
      }

      console.log('[AuthController.login] User found:', { email: user.email, status: user.status });
      console.log('[AuthController.login] Password hash:', user.password_hash?.substring(0, 20) + '...');

      // Check password
      console.log('[AuthController.login] Checking password...');
      const isPasswordValid = await user.comparePassword(password);
      console.log('[AuthController.login] Password valid:', isPasswordValid);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
        return;
      }

      // Check if user is active
      if (user.status !== 'active') {
        res.status(401).json({
          success: false,
          message: 'Account is not active. Please verify your email or contact support.'
        });
        return;
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
      const roles = userRoles.map((ur: any) => ur.role_id.name);

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
            roles: roles
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });

    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  // @route   POST /api/auth/refresh
  // @desc    Refresh access token
  // @access  Public
  static async refresh(req, res) {
    try {
      const { session, user } = req as any;

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

    } catch (error: any) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Token refresh failed',
        error: error.message
      });
    }
  }

  // @route   POST /api/auth/logout
  // @desc    Logout user
  // @access  Private
  static async logout(req, res) {
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
        user_id: (req as any).user._id,
        action: 'LOGOUT',
        metadata: { refresh_token_provided: !!refreshToken }
      });

      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error.message
      });
    }
  }

  // @route   POST /api/auth/forgot-password
  // @desc    Request password reset
  // @access  Public
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if user exists or not
        res.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
        return;
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

    } catch (error: any) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset request failed',
        error: error.message
      });
    }
  }

  // @route   POST /api/auth/reset-password
  // @desc    Reset password
  // @access  Public
  static async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const resetRequest = await PasswordReset.findOne({
        token_hash: tokenHash
      }).populate('user_id');

      if (!resetRequest || !resetRequest.isValid()) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
        return;
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

    } catch (error: any) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset failed',
        error: error.message
      });
    }
  }
}

module.exports = { AuthHandler };

export {AuthHandler};
