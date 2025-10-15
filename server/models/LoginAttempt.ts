  import mongoose, { Schema, Document } from 'mongoose';

  export interface ILoginAttempt extends Document {
    email: string;
    ip_address: string;
    success: boolean;
    created_at: Date;
  }

  const loginAttemptSchema = new Schema<ILoginAttempt>({
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

  export const LoginAttempt = mongoose.model<ILoginAttempt>('LoginAttempt', loginAttemptSchema);

