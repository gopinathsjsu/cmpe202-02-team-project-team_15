import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-market');

async function debugLogin(): Promise<void> {
  try {
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const email = 'properuser@sjsu.edu';
    const password = 'TestPass123!';
    
    console.log('Debugging login...');
    console.log(`Looking for user with email: ${email}`);
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log(`- Email: ${user.email}`);
    console.log(`- Status: ${user.status}`);
    console.log(`- Password hash: ${user.password_hash.substring(0, 20)}...`);
    
    // Check password
    console.log('Testing password...');
    const isPasswordValid = await user.comparePassword(password);
    console.log(`Password valid: ${isPasswordValid}`);
    
    // Check if user is active
    console.log(`User status check: ${user.status === 'active'}`);
    
    if (user.status !== 'active') {
      console.log('❌ User is not active');
      return;
    }
    
    console.log('✅ All checks passed - login should work');

  } catch (error) {
    console.error('Error debugging login:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugLogin();
