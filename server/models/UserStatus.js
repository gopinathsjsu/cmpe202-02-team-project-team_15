const mongoose = require('mongoose');

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

module.exports = mongoose.model('UserStatus', userStatusSchema);
