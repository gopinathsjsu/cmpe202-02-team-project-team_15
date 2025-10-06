const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-market');

async function cleanAndCreateUser() {
  try {
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clean up all users
    await mongoose.connection.db.collection('users').deleteMany({});
    console.log('✅ All users deleted');
    
    // Create a fresh user
    const hashedPassword = await bcrypt.hash('TestPass123!', 12);
    
    const newUser = {
      email: 'freshuser@sjsu.edu',
      password_hash: hashedPassword,
      first_name: 'Fresh',
      last_name: 'User',
      status: 'active',
      email_verified_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await mongoose.connection.db.collection('users').insertOne(newUser);
    console.log('✅ Fresh user created successfully!');
    console.log(`- Email: ${newUser.email}`);
    console.log(`- Status: ${newUser.status}`);
    console.log(`- User ID: ${result.insertedId}`);
    
    // Test password
    const isMatch = await bcrypt.compare('TestPass123!', newUser.password_hash);
    console.log(`Password test: ${isMatch}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

cleanAndCreateUser();
