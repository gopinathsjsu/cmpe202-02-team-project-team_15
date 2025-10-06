const mongoose = require('mongoose');
const { User } = require('../models');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-market');

async function checkUserStatus() {
  try {
    const user = await User.findOne({ email: 'test@sjsu.edu' });
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User details:');
    console.log(`- Email: ${user.email}`);
    console.log(`- Status: ${user.status}`);
    console.log(`- Email Verified At: ${user.email_verified_at}`);
    console.log(`- Created At: ${user.created_at}`);

  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkUserStatus();
