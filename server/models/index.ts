// Export all models using dynamic imports to avoid ES module issues
const getModels = async () => {
  const User = require('./User');
  const Campus = require('./Campus');
  const Role = require('./Role');
  const UserRole = require('./UserRole');
  const Session = require('./Session');
  const EmailVerification = require('./EmailVerification');
  const PasswordReset = require('./PasswordReset');
  const LoginAttempt = require('./LoginAttempt');
  const AuditLog = require('./AuditLog');
  const UserStatus = require('./UserStatus');

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
module.exports = { getModels };
module.exports.default = getModels;

export {};

