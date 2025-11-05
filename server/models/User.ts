import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  status: 'pending_verification' | 'active' | 'suspended' | 'deleted';
  email_verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
  full_name: string;
  bio?: string;
  contactNumber?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    [key: string]: string | undefined;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  first_name: {
    type: String,
    required: true,
    trim: true
  },
  last_name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending_verification', 'active', 'suspended', 'deleted'],
    default: 'active'
  },
  email_verified_at: {
    type: Date,
    default: null
  },
  bio: {
    type: String,
    default: '',
    trim: true
  },
  contactNumber: {
    type: String,
    default: '',
    trim: true
  },
  socialLinks: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for email
userSchema.index({ email: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// Virtual for full name
userSchema.virtual('full_name').get(function() {
  return `${this.first_name} ${this.last_name}`;
});

export const User = mongoose.model<IUser>('User', userSchema);

