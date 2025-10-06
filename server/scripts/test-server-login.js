const mongoose = require('mongoose');
const { User } = require('../models');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-market');

async function testServerLogin() {
  try {
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const email = 'properuser@sjsu.edu';
    const password = 'TestPass123!';
    
    console.log('Testing server login logic...');
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log(`- Email: ${user.email}`);
    console.log(`- Status: ${user.status}`);
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    console.log(`Password valid: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return;
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      console.log('❌ User is not active');
      return;
    }
    
    console.log('✅ All checks passed - login should work');
    console.log('The issue might be in the server code or middleware');

  } catch (error) {
    console.error('Error testing login:', error);
  } finally {
    mongoose.connection.close();
  }
}

testServerLogin();
