const { LoginAttempt } = require('../models');

// Rate limiting for login attempts
const loginRateLimit = async (req, res, next) => {
  try {
    const { email } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Check failed attempts in last 5 minutes
    const recentFailedAttempts = await LoginAttempt.countDocuments({
      email: email,
      success: false,
      created_at: { $gte: fiveMinutesAgo }
    });

    // Check failed attempts from same IP in last hour
    const ipFailedAttempts = await LoginAttempt.countDocuments({
      ip_address: clientIP,
      success: false,
      created_at: { $gte: oneHourAgo }
    });

    // Rate limiting rules
    if (recentFailedAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed login attempts. Please try again in 5 minutes.',
        retryAfter: 300 // 5 minutes in seconds
      });
    }

    if (ipFailedAttempts >= 20) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed login attempts from this IP. Please try again later.',
        retryAfter: 3600 // 1 hour in seconds
      });
    }

    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Don't block the request if rate limiting fails
    next();
  }
};

// Log login attempt
const logLoginAttempt = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log the attempt after response is sent
    setImmediate(async () => {
      try {
        const { email } = req.body;
        const clientIP = req.ip || req.connection.remoteAddress;
        const success = res.statusCode === 200;

        await LoginAttempt.create({
          email: email,
          ip_address: clientIP,
          success: success
        });
      } catch (error) {
        console.error('Error logging login attempt:', error);
      }
    });

    originalSend.call(this, data);
  };

  next();
};

module.exports = {
  loginRateLimit,
  logLoginAttempt
};
