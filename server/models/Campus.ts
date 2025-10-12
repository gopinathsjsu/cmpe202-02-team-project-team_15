import mongoose from 'mongoose';

const campusSchema = new mongoose.Schema({
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

export default mongoose.model('Campus', campusSchema);

