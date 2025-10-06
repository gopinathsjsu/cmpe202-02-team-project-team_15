const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-market');

async function testPassword() {
  try {
    const user = await User.findOne({ email: 'test@sjsu.edu' });
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Testing password comparison...');
    console.log(`User password hash: ${user.password_hash.substring(0, 20)}...`);
    
    const isMatch = await user.comparePassword('TestPass123!');
    console.log(`Password match: ${isMatch}`);

    // Also test with bcrypt directly
    const directTest = await bcrypt.compare('TestPass123!', user.password_hash);
    console.log(`Direct bcrypt test: ${directTest}`);

  } catch (error) {
    console.error('Error testing password:', error);
  } finally {
    mongoose.connection.close();
  }
}

testPassword();
