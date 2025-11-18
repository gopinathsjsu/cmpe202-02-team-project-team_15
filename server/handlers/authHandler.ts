const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { User, Session, EmailVerification, PasswordReset, AuditLog, UserRole, Role } = require('../models');
const { sendVerificationEmail } = require('../services/emailService');

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

// Helper function to generate 6-digit verification code
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send password reset email (mock implementation)
const sendPasswordResetEmail = async (user: any, token: string): Promise<boolean> => {
  // In a real implementation, you would use nodemailer or similar
  return true;
};

class AuthHandler {
  // @route   GET /api/auth/check-verification/:email
  // @desc    Check if email is verified
  // @access  Public
  static async checkVerification(req, res) {
    try {
      const { email } = req.params;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required'
        });
        return;
      }

      // Normalize email for lookup
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check if user already exists with this email
      const existingUser = await User.findOne({ email: normalizedEmail });
      
      // If user exists, they're already registered - return error
      if (existingUser) {
        res.json({
          success: true,
          data: {
            email: normalizedEmail,
            verified: false,
            userExists: true
          }
        });
        return;
      }

      // For new registrations, only accept verifications used within the last 24 hours
      // This prevents old verification records from being reused after user deletion
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Find verification record that has been used (verified) recently
      const verification = await EmailVerification.findOne({
        email: normalizedEmail,
        used_at: { 
          $ne: null,
          $gte: oneDayAgo  // Only accept verifications used in the last 24 hours
        }
      }).sort({ used_at: -1 });

      // Also check all verifications for this email for debugging
      const allVerifications = await EmailVerification.find({
        email: normalizedEmail
      }).sort({ used_at: -1 }).limit(5);

      console.log('Check verification for email:', {
        requestedEmail: normalizedEmail,
        userExists: !!existingUser,
        found: !!verification,
        usedAt: verification?.used_at,
        isRecent: verification ? verification.used_at >= oneDayAgo : false,
        emailMatch: verification?.email === normalizedEmail,
        totalVerifications: allVerifications.length,
        allVerifications: allVerifications.map(v => ({
          used: !!v.used_at,
          usedAt: v.used_at,
          isRecent: v.used_at ? v.used_at >= oneDayAgo : false,
          expiresAt: v.expires_at,
          email: v.email
        }))
      });

      res.json({
        success: true,
        data: {
          email: normalizedEmail,
          verified: !!verification
        }
      });
    } catch (error: any) {
      console.error('Check verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check verification status',
        error: error.message
      });
    }
  }

  // @route   POST /api/auth/request-verification
  // @desc    Request email verification (send code + link)
  // @access  Public
  static async requestVerification(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required'
        });
        return;
      }

      // Validate .edu domain
      const emailDomain = email.split('@')[1];
      if (!emailDomain || !emailDomain.endsWith('.edu')) {
        res.status(400).json({
          success: false,
          message: 'Email must be from an educational institution (.edu domain)'
        });
        return;
      }

      // Check if email is already registered
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'An account with this email already exists'
        });
        return;
      }

      // Generate verification code (6-digit for manual entry)
      const verificationCode = generateVerificationCode();
      
      // Generate secure token for link verification (32 bytes = 64 hex chars)
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

      // Expires in 15 minutes
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Delete any existing verification requests for this email
      await EmailVerification.deleteMany({ 
        email: email.toLowerCase(),
        used_at: null 
      });

      // Create new verification record with both code and token
      await EmailVerification.create({
        email: email.toLowerCase(),
        verification_code: verificationCode,
        token_hash: tokenHash, // Hash of secure token for link verification
        expires_at: expiresAt
      });

      // Generate verification link using the secure token (not the code)
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const verificationLink = `${clientUrl}/verify-email/${verificationToken}`;

      // Send verification email
      const emailSent = await sendVerificationEmail(
        email.toLowerCase(),
        verificationCode,
        verificationLink
      );

      if (!emailSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to send verification email. Please check server logs for details. Make sure EMAIL_USER and EMAIL_PASS are configured in your .env file. For Gmail, you need to use an App Password.'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Verification email sent successfully',
        data: {
          email: email.toLowerCase(),
          expiresAt: expiresAt
        }
      });

    } catch (error: any) {
      console.error('Request verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email',
        error: error.message
      });
    }
  }

  // @route   POST /api/auth/verify-code
  // @desc    Verify email using verification code
  // @access  Public
  static async verifyCode(req, res) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        res.status(400).json({
          success: false,
          message: 'Email and verification code are required'
        });
        return;
      }

      // Find verification record
      const verification = await EmailVerification.findOne({
        email: email.toLowerCase(),
        used_at: null
      }).sort({ sent_at: -1 }); // Get most recent

      if (!verification || !verification.isCodeValid(code)) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired verification code'
        });
        return;
      }

      // Mark as used
      verification.used_at = new Date();
      await verification.save();

      res.json({
        success: true,
        message: 'Email verified successfully',
        data: {
          email: email.toLowerCase(),
          verified: true
        }
      });

    } catch (error: any) {
      console.error('Verify code error:', error);
      res.status(500).json({
        success: false,
        message: 'Email verification failed',
        error: error.message
      });
    }
  }

  // @route   GET /api/auth/verify-email/:token
  // @desc    Verify email using verification link (secure token from email)
  // @access  Public
  static async verifyEmailLink(req, res) {
    try {
      // Get token from params (this is the secure token from email link)
      let { token } = req.params;
      
      // Handle URL encoding issues - decode if needed
      if (token) {
        try {
          token = decodeURIComponent(token);
        } catch (e) {
          // Token might already be decoded, continue
        }
      }
      
      const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');

      console.log('Verification link clicked with token:', {
        token: token ? `${token.substring(0, 10)}...` : 'missing',
        tokenLength: token?.length,
        acceptsJson,
        url: req.url
      });

      if (!token || token.length !== 64) {
        console.error('Invalid token provided in verification link (expected 64 hex chars)');
        if (acceptsJson) {
          return res.status(400).json({
            success: false,
            message: 'Invalid verification link'
          });
        }
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Verification Failed</title>
            <style>
              body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f3f4f6; }
              .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
              .error { color: #dc2626; }
              .success { color: #059669; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Verification Failed</h1>
              <p>Invalid verification token. Please request a new verification email.</p>
            </div>
          </body>
          </html>
        `);
      }

      // Hash the token and find verification record
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      // First, try to find unused verification record
      let verification = await EmailVerification.findOne({
        token_hash: tokenHash,
        used_at: null
      });

      // If not found, check if it was already used (for better error message)
      if (!verification) {
        verification = await EmailVerification.findOne({
          token_hash: tokenHash
        });
        
        if (verification && verification.used_at) {
          // Already verified
          const verifiedEmail = verification.email.toLowerCase().trim();
          console.log('Verification link already used:', verifiedEmail);
          if (acceptsJson) {
            return res.json({
              success: true,
              message: 'Email already verified',
              data: {
                email: verifiedEmail,
                verified: true,
                alreadyVerified: true
              }
            });
          }
          const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
          return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Already Verified</title>
              <style>
                body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f3f4f6; }
                .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
                .success { color: #059669; }
                .checkmark { width: 80px; height: 80px; border-radius: 50%; background: #d1fae5; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
                .checkmark svg { width: 50px; height: 50px; color: #059669; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="checkmark">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h1 class="success">Already Verified!</h1>
                <p>This email has already been verified. You can now complete your registration.</p>
                <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">This window can be closed.</p>
              </div>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'EMAIL_VERIFIED', email: '${verification.email}' }, '${clientUrl}');
                  setTimeout(() => window.close(), 2000);
                } else {
                  setTimeout(() => {
                    window.location.href = '${clientUrl}/signup?verified=true&email=${verification.email}';
                  }, 3000);
                }
              </script>
            </body>
            </html>
          `);
        }
      }

      console.log('Verification record found:', {
        found: !!verification,
        email: verification?.email,
        isValid: verification?.isValid(),
        expiresAt: verification?.expires_at,
        usedAt: verification?.used_at
      });

      if (!verification || !verification.isValid()) {
        console.error('Verification failed:', {
          verificationExists: !!verification,
          isValid: verification?.isValid(),
          expired: verification ? verification.expires_at < new Date() : 'N/A',
          used: verification ? !!verification.used_at : 'N/A'
        });
        if (acceptsJson) {
          return res.status(400).json({
            success: false,
            message: 'Invalid or expired verification link'
          });
        }
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Verification Failed</title>
            <style>
              body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f3f4f6; }
              .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
              .error { color: #dc2626; }
              .success { color: #059669; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Verification Failed</h1>
              <p>Invalid or expired verification link. Please request a new verification email.</p>
            </div>
          </body>
          </html>
        `);
      }

      // Mark as used
      verification.used_at = new Date();
      await verification.save();

      console.log('Email verified successfully:', {
        email: verification.email,
        usedAt: verification.used_at,
        verificationId: verification._id
      });

      // Return JSON if API request
      if (acceptsJson) {
        // Ensure email is normalized
        const verifiedEmail = verification.email.toLowerCase().trim();
        console.log('Returning verification success with email:', verifiedEmail);
        return res.json({
          success: true,
          message: 'Email verified successfully',
          data: {
            email: verifiedEmail,
            verified: true
          }
        });
      }

      // Send success page with script to notify parent window
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Verified</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f3f4f6; }
            .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
            .success { color: #059669; }
            .checkmark { width: 80px; height: 80px; border-radius: 50%; background: #d1fae5; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
            .checkmark svg { width: 50px; height: 50px; color: #059669; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="checkmark">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 class="success">Email Verified Successfully!</h1>
            <p>Your email address has been verified. You can now complete your registration.</p>
            <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">This window can be closed.</p>
          </div>
          <script>
            // Notify parent window if opened from signup page
            if (window.opener) {
              window.opener.postMessage({ type: 'EMAIL_VERIFIED', email: '${verification.email}' }, '${clientUrl}');
              setTimeout(() => window.close(), 2000);
            } else {
              // If not opened from signup, redirect after 3 seconds
              setTimeout(() => {
                window.location.href = '${clientUrl}/signup?verified=true&email=${verification.email}';
              }, 3000);
            }
          </script>
        </body>
        </html>
      `);

    } catch (error: any) {
      console.error('Verify email link error:', error);
      const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
      if (acceptsJson) {
        return res.status(500).json({
          success: false,
          message: 'An error occurred during verification',
          error: error.message
        });
      }
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Error</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f3f4f6; }
            .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Verification Error</h1>
            <p>An error occurred during verification. Please try again.</p>
          </div>
        </body>
        </html>
      `);
    }
  }

  // @route   POST /api/auth/register
  // @desc    Register a new user
  // @access  Public
  static async register(req, res) {
    try {
      // Handle both field name formats (frontend sends firstName/lastName, backend expects first_name/last_name)
      const { email, password, first_name, last_name, firstName, lastName, adminKey } = req.body;
      const finalFirstName = first_name || firstName;
      const finalLastName = last_name || lastName;

      // Normalize email
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user already exists
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Email is already registered. Please login instead.'
        });
        return;
      }

      let roleName = 'user';
      let relaxEdu = false;

      if (adminKey && adminKey === 'cmpe202') {
        roleName = 'admin';
        relaxEdu = true;
      }

      // If not admin, check .edu domain
      if (!relaxEdu) {
        const emailDomain = normalizedEmail.split('@')[1];
        if (!emailDomain || !emailDomain.endsWith('.edu')) {
          res.status(400).json({
            success: false,
            message: 'Email must be from an educational institution (.edu domain)'
          });
          return;
        }
      }

      // Check if email is verified
      // Only accept verifications used within the last 24 hours to prevent reuse of old verifications
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const verification = await EmailVerification.findOne({
        email: normalizedEmail,
        used_at: { 
          $ne: null,
          $gte: oneDayAgo  // Only accept verifications used in the last 24 hours
        }
      }).sort({ used_at: -1 });

      if (!verification) {
        res.status(400).json({
          success: false,
          message: 'Please verify your email address before registering. Check your inbox for the verification code or link. Verification links expire after 24 hours.'
        });
        return;
      }

      // Create user
      const user = new User({
        email: normalizedEmail,
        password_hash: password, // Will be hashed by pre-save middleware
        first_name: finalFirstName,
        last_name: finalLastName,
        status: 'active',
        email_verified_at: verification.used_at || new Date()
      });
      try {
        await user.save();
        
        // Link verification to user
        verification.user_id = user._id;
        await verification.save();
      } catch (saveError) {
        return res.status(400).json({ success: false, message: saveError.message || "Invalid signup data" });
      }

      // Assign role
      const foundRole = await Role.findOne({ name: roleName });
      if (foundRole) {
        await UserRole.create({ user_id: user._id, role_id: foundRole._id });
        console.log(`Assigned role '${roleName}' to user ${user.email}`);
      } else {
        console.error('Role not found:', roleName);
      }

      // Log audit event
      await AuditLog.create({ user_id: user._id, action: 'SIGN_UP', metadata: { email, admin: roleName === 'admin' } });

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

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
        return;
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
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
