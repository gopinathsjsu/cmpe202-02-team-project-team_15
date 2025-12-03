import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  status: 'pending_verification' | 'active' | 'suspended' | 'deleted';
  email_verified_at: Date | null;
  university: string;
  created_at: Date;
  updated_at: Date;
  full_name: string;
  photo_url?: string;
  photoUrl?: string | null;
  photoThumbUrl?: string | null;
  bio?: string;
  contact_info?: {
    phone?: string;
    address?: string;
    social_media?: {
      linkedin?: string;
      twitter?: string;
      instagram?: string;
    };
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
  university: {
    type: String,
    required: true,
    default: 'sjsu',
    index: true
  },
  photo_url: {
    type: String,
    default: null
  },
  photoUrl: {
    type: String,
    default: null
  },
  photoThumbUrl: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: null,
    maxlength: 500
  },
  contact_info: {
    phone: {
      type: String,
      default: null
    },
    address: {
      type: String,
      default: null
    },
    social_media: {
      linkedin: {
        type: String,
        default: null
      },
      twitter: {
        type: String,
        default: null
      },
      instagram: {
        type: String,
        default: null
      }
    }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Note: email index is automatically created by unique: true, so no need for explicit index

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

