const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token_hash: {
    type: String,
    required: true,
    unique: true
  },
  expires_at: {
    type: Date,
    required: true
  },
  used_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'sent_at', updatedAt: 'updated_at' }
});

// Index for cleanup of expired tokens
passwordResetSchema.index({ expires_at: 1 });
passwordResetSchema.index({ user_id: 1 });

// Method to check if token is valid
passwordResetSchema.methods.isValid = function() {
  return !this.used_at && this.expires_at > new Date();
};

module.exports = mongoose.model('PasswordReset', passwordResetSchema);

export {};

