const { body, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  // Handle both field name formats - make them optional but validate if present
  body('first_name')
    .optional()
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('last_name')
    .optional()
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('firstName')
    .optional()
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  // Custom validation to ensure at least one name format is provided
  body().custom((value) => {
    const hasFirstName = value.first_name || value.firstName;
    const hasLastName = value.last_name || value.lastName;
    
    if (!hasFirstName) {
      throw new Error('First name is required');
    }
    if (!hasLastName) {
      throw new Error('Last name is required');
    }
    return true;
  }),
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Password reset request validation
const validatePasswordResetRequest = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  handleValidationErrors
];

// Password reset validation
const validatePasswordReset = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  handleValidationErrors
];

// Campus creation validation
const validateCampusCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Campus name must be between 1 and 100 characters'),
  body('email_domain')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email domain'),
  handleValidationErrors
];

// Role assignment validation
const validateRoleAssignment = [
  body('user_id')
    .isMongoId()
    .withMessage('Please provide a valid user ID'),
  body('role_id')
    .isMongoId()
    .withMessage('Please provide a valid role ID'),
  handleValidationErrors
];

// Email verification validation
const validateEmailVerification = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateCampusCreation,
  validateRoleAssignment,
  validateEmailVerification,
  handleValidationErrors
};

export { validateUserRegistration, validateUserLogin, validatePasswordResetRequest, validatePasswordReset, validateEmailVerification, validateCampusCreation, validateRoleAssignment, handleValidationErrors };

