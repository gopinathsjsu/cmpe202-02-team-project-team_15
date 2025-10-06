const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-market');

async function createNewUser() {
  try {
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a new user directly in the collection
    const hashedPassword = await bcrypt.hash('TestPass123!', 12);
    
    const newUser = {
      email: 'newuser@sjsu.edu',
      password_hash: hashedPassword,
      first_name: 'New',
      last_name: 'User',
      status: 'active',
      email_verified_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await mongoose.connection.db.collection('users').insertOne(newUser);
    console.log('✅ New user created successfully!');
    console.log(`- Email: ${newUser.email}`);
    console.log(`- Status: ${newUser.status}`);
    console.log(`- User ID: ${result.insertedId}`);

  } catch (error) {
    console.error('Error creating new user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createNewUser();
