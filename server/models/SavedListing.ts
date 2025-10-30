import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISavedListing extends Document {
  userId: Types.ObjectId;
  listingId: Types.ObjectId;
  saved_at: Date;
}

const savedListingSchema = new Schema<ISavedListing>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listingId: {
    type: Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  saved_at: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure a user can only save a listing once
savedListingSchema.index({ userId: 1, listingId: 1 }, { unique: true });

// Index for querying user's saved listings
savedListingSchema.index({ userId: 1, saved_at: -1 });

export const SavedListing = mongoose.model<ISavedListing>('SavedListing', savedListingSchema);



