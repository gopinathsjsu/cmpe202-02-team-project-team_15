import mongoose, { Schema, Document } from 'mongoose';

export interface IPasswordReset extends Document {
  user_id: mongoose.Types.ObjectId;
  verification_code?: string; // 6-digit code for manual verification
  token_hash: string; // For link verification
  expires_at: Date;
  used_at: Date | null;
  sent_at: Date;
  updated_at: Date;
  isValid(): boolean;
  isCodeValid(code: string): boolean;
}

const passwordResetSchema = new Schema<IPasswordReset>({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Indexes for faster lookups
passwordResetSchema.index({ expires_at: 1 });
passwordResetSchema.index({ user_id: 1 });
passwordResetSchema.index({ verification_code: 1 }); // For manual code verification
passwordResetSchema.index({ token_hash: 1 }); // For link verification

// Method to check if token is valid
passwordResetSchema.methods.isValid = function() {
  return !this.used_at && this.expires_at > new Date();
};

// Method to check if code is valid
passwordResetSchema.methods.isCodeValid = function(code: string) {
  if (!this.verification_code || !code) return false;
  return this.verification_code === code && this.isValid();
};

export const PasswordReset = mongoose.model<IPasswordReset>('PasswordReset', passwordResetSchema);

