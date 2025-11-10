import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Migration script to update existing User documents with new schema fields
 * 
 * This script adds the following fields to existing users:
 * - photo_url (default: null)
 * - bio (default: null)
 * - contact_info.phone (default: null)
 * - contact_info.address (default: null)
 * - contact_info.social_media.linkedin (default: null)
 * - contact_info.social_media.twitter (default: null)
 * - contact_info.social_media.instagram (default: null)
 */

const migrateUserSchema = async () => {
  try {
    console.log('🔄 Starting user schema migration...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/campus-market';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get the users collection
    const db = mongoose.connection.db;
    const usersCollection = db?.collection('users');

    if (!usersCollection) {
      throw new Error('Users collection not found');
    }

    // Count total users before migration
    const totalUsers = await usersCollection.countDocuments({});
    console.log(`📊 Found ${totalUsers} users to migrate`);

    // Update all users that don't have the new fields
    const result = await usersCollection.updateMany(
      {}, // Match all documents
      {
        $set: {
          // Only set if field doesn't exist
          photo_url: null,
          bio: null,
          'contact_info.phone': null,
          'contact_info.address': null,
          'contact_info.social_media.linkedin': null,
          'contact_info.social_media.twitter': null,
          'contact_info.social_media.instagram': null
        }
      },
      {
        // Don't insert if document doesn't exist, only update existing
        upsert: false
      }
    );

    console.log('\n✅ Migration successf...');
    console.log(`📝 Matched doc..: ${result.matchedCount}`);
    console.log(`🔄 Modified docs...: ${result.modifiedCount}`);

    // Verify migration by sampling a few users
    console.log('\n🔍 Verfying migratn...');
    const sampleUsers = await usersCollection.find({}).limit(3).toArray();
    
    console.log('\n Sample users after migration was done:');
    sampleUsers.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.first_name} ${user.last_name}`);
      console.log(`Photo URL: ${user.photo_url}`);
      console.log(`Bio: ${user.bio}`);
      console.log(`Contact Info:`, JSON.stringify(user.contact_info, null, 2));
    });

    console.log('\n✅ completed!');

  } catch (error) {
    console.error('❌ Migration was failed failed:', error);
    throw error;
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the migration
migrateUserSchema()
  .then(() => {
    console.log('\n🎉 Migration script was completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed for some reasons :', error);
    process.exit(1);
  });
