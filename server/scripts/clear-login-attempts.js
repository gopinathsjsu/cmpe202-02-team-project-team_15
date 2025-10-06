const mongoose = require('mongoose');
const { LoginAttempt } = require('../models');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-market');

async function clearLoginAttempts() {
  try {
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clear all login attempts
    const result = await LoginAttempt.deleteMany({});
    console.log(`✅ Cleared ${result.deletedCount} login attempts`);
    
    console.log('Login attempts cleared. Try logging in again.');

  } catch (error) {
    console.error('Error clearing login attempts:', error);
  } finally {
    mongoose.connection.close();
  }
}

clearLoginAttempts();
