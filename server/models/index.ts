// Export all models using dynamic imports to avoid ES module issues
export const getModels = async () => {
  const User = (await import('./User.ts')).default;
  const Campus = (await import('./Campus.ts')).default;
  const Role = (await import('./Role.ts')).default;
  const UserRole = (await import('./UserRole.ts')).default;
  const Session = (await import('./Session.ts')).default;
  const EmailVerification = (await import('./EmailVerification.ts')).default;
  const PasswordReset = (await import('./PasswordReset.ts')).default;
  const LoginAttempt = (await import('./LoginAttempt.ts')).default;
  const AuditLog = (await import('./AuditLog.ts')).default;
  const UserStatus = (await import('./UserStatus.ts')).default;

  return {
    User,
    Campus,
    Role,
    UserRole,
    Session,
    EmailVerification,
    PasswordReset,
    LoginAttempt,
    AuditLog,
    UserStatus
  };
};

// For backward compatibility, export a function that returns models
export default getModels;

