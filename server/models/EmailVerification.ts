import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailVerification extends Document {
  user_id: mongoose.Types.ObjectId;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  sent_at: Date;
  updated_at: Date;
  isValid(): boolean;
}

const emailVerificationSchema = new Schema<IEmailVerification>({
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

export const EmailVerification = mongoose.model<IEmailVerification>('EmailVerification', emailVerificationSchema);

