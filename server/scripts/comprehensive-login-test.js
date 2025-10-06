const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-market');

async function comprehensiveLoginTest() {
  try {
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const email = 'properuser@sjsu.edu';
    const password = 'TestPass123!';
    
    console.log('=== Comprehensive Login Test ===');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('');
    
    // Find user
    console.log('Step 1: Finding user...');
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    console.log('✅ User found');
    console.log(`  - ID: ${user._id}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Status: ${user.status}`);
    console.log(`  - Password hash: ${user.password_hash.substring(0, 30)}...`);
    console.log('');
    
    // Test password comparison
    console.log('Step 2: Testing password comparison...');
    console.log(`  - Using user.comparePassword()`);
    const isPasswordValid = await user.comparePassword(password);
    console.log(`  - Result: ${isPasswordValid}`);
    console.log('');
    
    console.log('Step 3: Testing direct bcrypt comparison...');
    const directTest = await bcrypt.compare(password, user.password_hash);
    console.log(`  - Result: ${directTest}`);
    console.log('');
    
    // Check if comparePassword method exists
    console.log('Step 4: Checking comparePassword method...');
    console.log(`  - Method exists: ${typeof user.comparePassword === 'function'}`);
    console.log(`  - User instance: ${user.constructor.name}`);
    console.log('');
    
    // Check user status
    console.log('Step 5: Checking user status...');
    console.log(`  - Status: ${user.status}`);
    console.log(`  - Is active: ${user.status === 'active'}`);
    console.log('');
    
    if (isPasswordValid && user.status === 'active') {
      console.log('✅ All checks passed - login should work!');
    } else {
      console.log('❌ Login should fail');
      if (!isPasswordValid) console.log('  - Reason: Invalid password');
      if (user.status !== 'active') console.log('  - Reason: User not active');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

comprehensiveLoginTest();
