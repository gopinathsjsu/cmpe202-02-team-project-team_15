import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailVerification extends Document {
  email: string; // Email address for pre-registration verification
  user_id?: mongoose.Types.ObjectId; // Optional (may not exist yet during pre-registration)
  verification_code?: string; // 6-digit code
  token_hash: string; // For link verification
  expires_at: Date;
  used_at: Date | null;
  sent_at: Date;
  updated_at: Date;
  isValid(): boolean;
  isCodeValid(code: string): boolean;
}

const emailVerificationSchema = new Schema<IEmailVerification>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for pre-registration verification
  },
  verification_code: {
    type: String,
    required: false,
    length: 6
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

// Indexes
emailVerificationSchema.index({ expires_at: 1 });
emailVerificationSchema.index({ email: 1 });
emailVerificationSchema.index({ user_id: 1 });
emailVerificationSchema.index({ verification_code: 1 }); // For manual code verification
emailVerificationSchema.index({ token_hash: 1 }); // For link verification

// Method to check if token is valid
emailVerificationSchema.methods.isValid = function() {
  return !this.used_at && this.expires_at > new Date();
};

// Method to check if code is valid
emailVerificationSchema.methods.isCodeValid = function(code: string) {
  if (!this.verification_code || !code) return false;
  return this.verification_code === code && this.isValid();
};

export const EmailVerification = mongoose.model<IEmailVerification>('EmailVerification', emailVerificationSchema);

