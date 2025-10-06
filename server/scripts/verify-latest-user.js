const mongoose = require('mongoose');
const { User } = require('../models');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-market', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function verifyLatestUser() {
  try {
    // Find the latest user
    const latestUser = await User.findOne().sort({ created_at: -1 });
    
    if (!latestUser) {
      console.log('No users found in the database.');
      return;
    }

    console.log('Latest user found:');
    console.log(`- Name: ${latestUser.first_name} ${latestUser.last_name}`);
    console.log(`- Email: ${latestUser.email}`);
    console.log(`- Status: ${latestUser.status}`);
    console.log(`- Email Verified At: ${latestUser.email_verified_at}`);

    // Update the user to be verified and active
    latestUser.status = 'active';
    latestUser.email_verified_at = new Date();
    
    await latestUser.save();

    console.log('\n✅ User has been verified and activated!');
    console.log(`- New Status: ${latestUser.status}`);
    console.log(`- Email Verified At: ${latestUser.email_verified_at}`);

  } catch (error) {
    console.error('Error verifying user:', error);
  } finally {
    mongoose.connection.close();
  }
}

verifyLatestUser();
