const mongoose = require('mongoose');

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

module.exports = mongoose.model('Role', roleSchema);
