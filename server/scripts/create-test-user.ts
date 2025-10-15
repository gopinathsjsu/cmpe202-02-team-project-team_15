import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { UserRole } from '../models/UserRole';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-market');

async function createTestUser(): Promise<void> {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'test@sjsu.edu' });
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('TestPass123!', 10);

    // Create user
    const user = new User({
      email: 'test@sjsu.edu',
      password_hash: hashedPassword,
      first_name: 'Test',
      last_name: 'User',
      status: 'active',
      email_verified_at: new Date()
    });

    await user.save();

    // Assign buyer role
    let buyerRole = await Role.findOne({ name: 'buyer' });
    if (!buyerRole) {
      buyerRole = new Role({ name: 'buyer' });
      await buyerRole.save();
    }

    await UserRole.create({
      user_id: user._id,
      role_id: buyerRole._id
    });

    console.log('✅ Test user created successfully!');
    console.log(`- Email: ${user.email}`);
    console.log(`- Name: ${user.first_name} ${user.last_name}`);
    console.log(`- Status: ${user.status}`);
    console.log(`- Email Verified: ${user.email_verified_at}`);

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestUser();
