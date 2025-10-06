const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cmpe202_project');

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('⚠️  Server will continue running without database connection');
    console.log('📝 To install MongoDB:');
    console.log('   macOS: brew install mongodb-community');
    console.log('   Ubuntu: sudo apt install mongodb');
    console.log('   Windows: Download from https://www.mongodb.com/try/download/community');
  }
};

module.exports = connectDB;
