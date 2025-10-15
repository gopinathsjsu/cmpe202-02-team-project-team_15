import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-market');

const app = express();
app.use(express.json());

// Test endpoint
app.post('/test-login', async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;
    
    console.log('Test login endpoint called');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      return res.json({ success: false, message: 'User not found' });
    }
    
    console.log(`User found: ${user.email}, Status: ${user.status}`);
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    console.log(`Password valid: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      console.log('Invalid password');
      return res.json({ success: false, message: 'Invalid password' });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      console.log('User not active');
      return res.json({ success: false, message: 'User not active' });
    }
    
    console.log('Login successful');
    res.json({ success: true, message: 'Login successful', user: { email: user.email, status: user.status } });
    
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.json({ success: false, message: 'Error: ' + error.message });
  }
});

app.listen(5001, () => {
  console.log('Test server running on port 5001');
});
