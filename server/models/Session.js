const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  refresh_token: {
    type: String,
    required: true,
    unique: true
  },
  user_agent: {
    type: String,
    default: ''
  },
  ip_address: {
    type: String,
    default: ''
  },
  expires_at: {
    type: Date,
    required: true
  },
  revoked_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for cleanup of expired sessions
sessionSchema.index({ expires_at: 1 });
sessionSchema.index({ user_id: 1 });

// Method to check if session is valid
sessionSchema.methods.isValid = function() {
  return !this.revoked_at && this.expires_at > new Date();
};

module.exports = mongoose.model('Session', sessionSchema);
