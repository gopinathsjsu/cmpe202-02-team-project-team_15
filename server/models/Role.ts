import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  name: 'buyer' | 'seller' | 'admin';
}

const roleSchema = new Schema<IRole>({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['buyer', 'seller', 'admin'],
    default: 'buyer'
  }
}, {
  timestamps: false
});

export const Role = mongoose.model<IRole>('Role', roleSchema);

