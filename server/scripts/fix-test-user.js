const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-market');

async function fixTestUser() {
  try {
    // Find the existing user
    const user = await User.findOne({ email: 'test@sjsu.edu' });
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Fixing user password...');
    
    // Hash the password correctly (without the pre-save middleware)
    const hashedPassword = await bcrypt.hash('TestPass123!', 12);
    
    // Update the user with the correctly hashed password
    user.password_hash = hashedPassword;
    await user.save();

    console.log('✅ Password fixed!');
    
    // Test the password
    const isMatch = await user.comparePassword('TestPass123!');
    console.log(`Password test: ${isMatch}`);

  } catch (error) {
    console.error('Error fixing user:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixTestUser();
