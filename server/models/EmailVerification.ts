import mongoose from 'mongoose';

const emailVerificationSchema = new mongoose.Schema({
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
emailVerificationSchema.index({ expires_at: 1 });
emailVerificationSchema.index({ user_id: 1 });

// Method to check if token is valid
emailVerificationSchema.methods.isValid = function() {
  return !this.used_at && this.expires_at > new Date();
};

export default mongoose.model('EmailVerification', emailVerificationSchema);

