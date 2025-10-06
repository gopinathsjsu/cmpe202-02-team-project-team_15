const jwt = require('jsonwebtoken');
const { User, Session } = require('../models');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    
    // Check if user exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or inactive user' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

// Middleware to check user roles
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const { UserRole, Role } = require('../models');
      
      // Get user roles
      const userRoles = await UserRole.find({ user_id: req.user._id })
        .populate('role_id');
      
      const userRoleNames = userRoles.map(ur => ur.role_id.name);
      
      // Check if user has any of the required roles
      const hasRequiredRole = roles.some(role => userRoleNames.includes(role));
      
      if (!hasRequiredRole) {
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        });
      }

      req.userRoles = userRoleNames;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Authorization error' 
      });
    }
  };
};

// Middleware to verify refresh token
const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token required' 
      });
    }

    const session = await Session.findOne({ 
      refresh_token: refreshToken 
    }).populate('user_id');

    if (!session || !session.isValid()) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired refresh token' 
      });
    }

    req.session = session;
    req.user = session.user_id;
    next();
  } catch (error) {
    console.error('Refresh token verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Token verification error' 
    });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  verifyRefreshToken
};
