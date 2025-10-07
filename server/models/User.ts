import mongoose, { Schema, Document, Types } from 'mongoose';

// User interface for database documents
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: 'student' | 'admin';
  campusId: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  campusId: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', userSchema);
