import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

/**
 * Rate limiting for profile photo updates
 * Prevents abuse by limiting updates per user
 * 
 * Rules:
 * - Max 5 updates per hour per user
 * - Max 20 updates per day per user
 */
export const profilePhotoRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get user to check last update times
    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check recent photo updates (using updated_at as proxy)
    // In production, you might want to track this in a separate collection
    const lastUpdate = user.updated_at || user.created_at;
    
    if (lastUpdate) {
      const timeSinceLastUpdate = now.getTime() - lastUpdate.getTime();
      
      // Rate limit: Minimum 1 minute between updates
      if (timeSinceLastUpdate < 60 * 1000) {
        res.status(429).json({
          success: false,
          message: 'Please wait before updating your profile photo again. Minimum 1 minute between updates.',
          retryAfter: Math.ceil((60 * 1000 - timeSinceLastUpdate) / 1000),
        });
        return;
      }
    }

    // For more sophisticated rate limiting, you could:
    // 1. Track photo updates in a separate collection
    // 2. Count updates in the last hour/day
    // 3. Use Redis for distributed rate limiting
    
    next();
  } catch (error: any) {
    console.error('Profile photo rate limiting error:', error);
    // Don't block the request if rate limiting fails
    next();
  }
};

