import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
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

export default mongoose.model('Role', roleSchema);

