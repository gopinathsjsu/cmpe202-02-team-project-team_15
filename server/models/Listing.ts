import mongoose, { Schema, Document, Types } from 'mongoose';

// Photo interface for listing photos
export interface IPhoto {
  url: string;
  alt: string;
}

// Listing interface for database documents
export interface IListing extends Document {
  _id: Types.ObjectId;
  listingId: string;
  userId: Types.ObjectId | import('./User').IUser;
  categoryId: Types.ObjectId | import('./Category').ICategory;
  title: string;
  description: string;
  price: number;
  status: 'ACTIVE' | 'SOLD';
  photos: IPhoto[];
  createdAt: Date;
  updatedAt: Date;
}

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

// Regular indexes for partial text search functionality - US-SEARCH-1 requirement
listingSchema.index({ title: 1 });
listingSchema.index({ description: 1 });

// Compound indexes for filtering
listingSchema.index({ categoryId: 1, price: 1 });
listingSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IListing>('Listing', listingSchema);
