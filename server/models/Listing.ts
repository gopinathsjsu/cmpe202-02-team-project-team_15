import mongoose, { Schema, Document } from 'mongoose';
import { IListing, IPhoto } from '../types';

const photoSchema = new Schema<IPhoto>({
  url: { type: String, required: true },
  alt: { type: String, default: '' }
});

const listingSchema = new Schema<IListing>({
  listingId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      // Generate custom ID: LST-YYYYMMDD-XXXX
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `LST-${dateStr}-${randomNum}`;
    }
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  categoryId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true 
  },
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 1000
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'SOLD'], 
    default: 'ACTIVE' 
  },
  photos: [photoSchema]
}, { 
  timestamps: true 
});

// Text index for search functionality - US-SEARCH-1 requirement
listingSchema.index({ title: 'text', description: 'text' });

// Compound indexes for filtering
listingSchema.index({ categoryId: 1, price: 1 });
listingSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IListing>('Listing', listingSchema);
