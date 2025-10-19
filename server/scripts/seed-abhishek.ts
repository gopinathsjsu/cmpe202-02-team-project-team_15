import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Role } from '../models/Role';
import { Campus } from '../models/Campus';

// Load environment variables
dotenv.config();

const seedDatabase = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cmpe202_project');

    console.log('Connected to MongoDB');

    // Create default roles
    const roles = [
      { name: 'buyer' },
      { name: 'seller' },
      { name: 'admin' }
    ];

    for (const roleData of roles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        await Role.create(roleData);
        console.log(`✅ Created role: ${roleData.name}`);
      } else {
        console.log(`⚠️  Role already exists: ${roleData.name}`);
      }
    }

    // Create sample campuses
    const campuses = [
      {
        name: 'San Jose State University',
        email_domain: 'sjsu.edu'
      },
      {
        name: 'University of California, Berkeley',
        email_domain: 'berkeley.edu'
      },
      {
        name: 'Stanford University',
        email_domain: 'stanford.edu'
      }
    ];

    for (const campusData of campuses) {
      const existingCampus = await Campus.findOne({ 
        $or: [
          { name: campusData.name },
          { email_domain: campusData.email_domain }
        ]
      });
      
      if (!existingCampus) {
        await Campus.create(campusData);
        console.log(`✅ Created campus: ${campusData.name}`);
      } else {
        console.log(`⚠️  Campus already exists: ${campusData.name}`);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
    process.exit(0);
  }
};

// Run the seed function
seedDatabase();
