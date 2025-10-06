const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-market');

async function fixTestUserFinal() {
  try {
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get the user directly from the collection to avoid middleware
    const user = await mongoose.connection.db.collection('users').findOne({ email: 'test@sjsu.edu' });
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Fixing user password (bypassing middleware)...');
    
    // Hash the password correctly
    const hashedPassword = await bcrypt.hash('TestPass123!', 12);
    
    // Update the user directly in the collection
    await mongoose.connection.db.collection('users').updateOne(
      { _id: user._id },
      { $set: { password_hash: hashedPassword } }
    );

    console.log('✅ Password fixed!');
    
    // Test the password
    const testUser = await mongoose.connection.db.collection('users').findOne({ email: 'test@sjsu.edu' });
    const isMatch = await bcrypt.compare('TestPass123!', testUser.password_hash);
    console.log(`Password test: ${isMatch}`);

  } catch (error) {
    console.error('Error fixing user:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixTestUserFinal();
