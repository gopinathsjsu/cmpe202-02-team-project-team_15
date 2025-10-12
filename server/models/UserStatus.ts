import mongoose from 'mongoose';

const userStatusSchema = new mongoose.Schema({
  pending_verification: {
    type: Boolean,
    default: true
  },
  active: {
    type: Boolean,
    default: false
  },
  suspended: {
    type: Boolean,
    default: false
  },
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: false
});

export default mongoose.model('UserStatus', userStatusSchema);

