import mongoose, { Schema, Document } from 'mongoose';

export interface IUserStatus extends Document {
  pending_verification: boolean;
  active: boolean;
  suspended: boolean;
  deleted: boolean;
}

const userStatusSchema = new Schema<IUserStatus>({
  pending_verification: {
    type: Boolean,
    default: true
  },
  active: {
    type: Boolean,
    default: false
  },
  suspended: {
    type: Boolean,
    default: false
  },
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: false
});

export const UserStatus = mongoose.model<IUserStatus>('UserStatus', userStatusSchema);

