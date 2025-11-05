import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spartan_market';

async function clearLoginAttempts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const LoginAttempt = mongoose.connection.collection('loginattempts');
    const result = await LoginAttempt.deleteMany({});
    console.log(`Cleared ${result.deletedCount} login attempts`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

clearLoginAttempts();
