// Database connection using dynamic import to avoid ES module issues
const connectDB = async () => {
  try {
    // Use dynamic import to avoid ES module compatibility issues
    const mongoose = require('mongoose');

    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/cmpe202_project';
    const conn = await mongoose.connect(uri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error: any) {
    console.error('❌ Database connection error:', error.message);
    console.log('⚠️  Server will continue running without database connection');
    console.log('📝 To install MongoDB:');
    console.log('   macOS: brew install mongodb-community');
    console.log('   Ubuntu: sudo apt install mongodb');
    console.log('   Windows: Download from https://www.mongodb.com/try/download/community');
    return null;
  }
};

module.exports = connectDB;

export { connectDB };
