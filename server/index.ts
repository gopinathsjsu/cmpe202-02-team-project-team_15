import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { app } from './app';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost/campus-marketplace')
  .then(() => {
    console.log('Database is connected!');
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });

// Start server
app.listen(PORT, () => {
  console.log(`Campus Marketplace up on ${PORT}`);
});
