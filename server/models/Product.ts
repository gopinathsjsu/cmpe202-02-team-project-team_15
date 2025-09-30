import { Schema, model, Types, Document } from 'mongoose';

const ProductSchema = new Schema({
sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});
export const Product = model('Product', ProductSchema);