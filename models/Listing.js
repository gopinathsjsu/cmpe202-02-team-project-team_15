// models/Listing.js
const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  categoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
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
  photos: [{
    url: { type: String, required: true },
    alt: { type: String, default: '' }
  }]
}, { 
  timestamps: true 
});

// Text index for search functionality - US-SEARCH-1 requirement
listingSchema.index({ title: 'text', description: 'text' });

// Compound indexes for filtering
listingSchema.index({ categoryId: 1, price: 1 });
listingSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Listing', listingSchema);
