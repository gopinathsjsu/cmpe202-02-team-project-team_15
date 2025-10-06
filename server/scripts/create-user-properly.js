const mongoose = require('mongoose');
const { User, Role, UserRole } = require('../models');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-market');

async function createUserProperly() {
  try {
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clean up all users first
    await User.deleteMany({});
    console.log('✅ All users deleted');
    
    // Create user using Mongoose model (password will be hashed by pre-save middleware)
    const user = new User({
      email: 'properuser@sjsu.edu',
      password_hash: 'TestPass123!', // This will be hashed by pre-save middleware
      first_name: 'Proper',
      last_name: 'User',
      status: 'active',
      email_verified_at: new Date()
    });

    await user.save();
    console.log('✅ User created properly with Mongoose!');
    console.log(`- Email: ${user.email}`);
    console.log(`- Status: ${user.status}`);
    console.log(`- User ID: ${user._id}`);
    
    // Test password comparison
    const isMatch = await user.comparePassword('TestPass123!');
    console.log(`Password test: ${isMatch}`);

    // Assign buyer role
    let buyerRole = await Role.findOne({ name: 'buyer' });
    if (!buyerRole) {
      buyerRole = new Role({ name: 'buyer', description: 'Buyer role' });
      await buyerRole.save();
    }

    await UserRole.create({
      user_id: user._id,
      role_id: buyerRole._id
    });

    console.log('✅ User role assigned');

  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createUserProperly();
