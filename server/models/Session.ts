import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  user_id: mongoose.Types.ObjectId;
  refresh_token: string;
  user_agent: string;
  ip_address: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
  updated_at: Date;
  isValid(): boolean;
}

const sessionSchema = new Schema<ISession>({
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

export const Session = mongoose.model<ISession>('Session', sessionSchema);

