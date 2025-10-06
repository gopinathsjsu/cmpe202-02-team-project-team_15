// Global type declarations for existing JavaScript modules

declare module '../models' {
  export const User: any;
  export const Campus: any;
  export const Session: any;
  export const EmailVerification: any;
  export const PasswordReset: any;
  export const AuditLog: any;
  export const UserRole: any;
  export const Role: any;
}

declare module '../middleware/validation' {
  export const validateUserRegistration: any;
  export const validateUserLogin: any;
  export const validatePasswordResetRequest: any;
  export const validatePasswordReset: any;
  export const validateEmailVerification: any;
}

declare module '../middleware/rateLimiting' {
  export const loginRateLimit: any;
  export const logLoginAttempt: any;
}

declare module '../middleware/auth' {
  export const authenticateToken: any;
  export const verifyRefreshToken: any;
}

declare module '../config/database' {
  const connectDB: () => void;
  export default connectDB;
}

declare module '../routes/users' {
  const userRoutes: any;
  export default userRoutes;
}

declare module '../routes/campus' {
  const campusRoutes: any;
  export default campusRoutes;
}

declare module '../routes/admin' {
  const adminRoutes: any;
  export default adminRoutes;
}

declare module 'dotenv' {
  export function config(): void;
}
