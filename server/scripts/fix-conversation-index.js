/**
 * Script to fix Conversation collection index issues
 * 
 * This script removes the old productId index and ensures the correct listingId index exists
 * 
 * Run this with: node server/scripts/fix-conversation-index.js
 * Or with MongoDB shell: mongo campus-marketplace < server/scripts/fix-conversation-index.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixConversationIndexes() {
  try {
    // Connect to MongoDB - try multiple env var names
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/campus-marketplace';
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('conversations');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));

    // Drop old productId index if it exists
    try {
      await collection.dropIndex('productId_1_buyerId_1_sellerId_1');
      console.log('✓ Dropped old productId index');
    } catch (err) {
      if (err.codeName === 'IndexNotFound') {
        console.log('✓ Old productId index does not exist (already cleaned)');
      } else {
        console.log('⚠ Could not drop productId index:', err.message);
      }
    }

    // Ensure the correct index exists
    try {
      await collection.createIndex(
        { listingId: 1, buyerId: 1, sellerId: 1 },
        { unique: true, name: 'listingId_1_buyerId_1_sellerId_1' }
      );
      console.log('✓ Created/verified listingId index');
    } catch (err) {
      console.log('⚠ Index might already exist:', err.message);
    }

    // Create lastMessageAt index if it doesn't exist
    try {
      await collection.createIndex(
        { lastMessageAt: -1 },
        { name: 'lastMessageAt_-1' }
      );
      console.log('✓ Created/verified lastMessageAt index');
    } catch (err) {
      console.log('⚠ Index might already exist:', err.message);
    }

    // List final indexes
    const finalIndexes = await collection.indexes();
    console.log('\nFinal indexes:');
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n✓ Index fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error fixing indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

fixConversationIndexes();

