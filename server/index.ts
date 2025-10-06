import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

// Import models to ensure they're registered with Mongoose
import './models/User';
import './models/Category';
import './models/Listing';

// Import routes
import searchRoutes from './routes/searchRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost/campus-marketplace');

// Routes
app.use('/api/listings', searchRoutes);

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Campus Marketplace API' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
