import mongoose, { Schema, Document, Types } from 'mongoose';

// Category interface for database documents
export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  description: { 
    type: String, 
    trim: true 
  }
}, { 
  timestamps: true 
});

export default mongoose.model<ICategory>('Category', categorySchema);
