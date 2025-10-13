const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  ip_address: {
    type: String,
    required: true
  },
  success: {
    type: Boolean,
    required: true,
    default: false
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Index for rate limiting and security monitoring
loginAttemptSchema.index({ email: 1, created_at: -1 });
loginAttemptSchema.index({ ip_address: 1, created_at: -1 });

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);
