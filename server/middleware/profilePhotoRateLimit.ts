import rateLimit from 'express-rate-limit';

/**
 * Rate limiting for profile photo updates
 * Allows 10 updates per 15 minutes per user
 */
export const profilePhotoRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Allow 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many profile photo update attempts. Please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
