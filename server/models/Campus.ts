import mongoose, { Schema, Document } from 'mongoose';

export interface ICampus extends Document {
  name: string;
  email_domain: string;
  created_at: Date;
  updated_at: Date;
}

const campusSchema = new Schema<ICampus>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email_domain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const Campus = mongoose.model<ICampus>('Campus', campusSchema);

