// Global type declarations for Express Request extensions
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      userRoles?: string[];
      session?: any;
    }
  }
}

// JWT payload interface
export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}
