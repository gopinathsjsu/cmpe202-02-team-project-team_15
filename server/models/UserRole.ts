import mongoose, { Schema, Document } from 'mongoose';

export interface IUserRole extends Document {
  user_id: mongoose.Types.ObjectId;
  role_id: mongoose.Types.ObjectId;
}

const userRoleSchema = new Schema<IUserRole>({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  }
}, {
  timestamps: false
});

// Compound index to ensure unique user-role combinations
userRoleSchema.index({ user_id: 1, role_id: 1 }, { unique: true });

export const UserRole = mongoose.model<IUserRole>('UserRole', userRoleSchema);

