import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Report } from '../models/Report';
import Listing from '../models/Listing';

// Load environment variables
dotenv.config();

/**
 * Cleanup script to remove orphaned reports (reports referencing deleted listings)
 */
const cleanupOrphanedReports = async () => {
  try {
    console.log('🔄 Starting orphaned reports cleanup...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/campus-market';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all reports
    const allReports = await Report.find({});
    console.log(`📊 Found ${allReports.length} total reports`);

    let orphanedCount = 0;
    const orphanedReportIds = [];

    // Check each report to see if its listing still exists
    for (const report of allReports) {
      if (report.listingId) {
        const listingExists = await Listing.findById(report.listingId);
        if (!listingExists) {
          orphanedReportIds.push(report._id);
          orphanedCount++;
          console.log(`❌ Orphaned report found: ${report._id} (listing: ${report.listingId})`);
        }
      }
    }

    if (orphanedCount === 0) {
      console.log('\n✅ No orphaned reports found! All reports reference valid listings.');
    } else {
      console.log(`\n⚠️  Found ${orphanedCount} orphaned reports`);
      console.log('🗑️  Deleting orphaned reports...');

      // Delete orphaned reports
      const deleteResult = await Report.deleteMany({
        _id: { $in: orphanedReportIds }
      });

      console.log(`✅ Successfully deleted ${deleteResult.deletedCount} orphaned reports`);
    }

    // Verify cleanup
    const remainingReports = await Report.find({});
    console.log(`\n📊 Total reports after cleanup: ${remainingReports.length}`);

    console.log('\n✅ Cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the cleanup
cleanupOrphanedReports()
  .then(() => {
    console.log('\n🎉 Cleanup script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup script failed:', error);
    process.exit(1);
  });
