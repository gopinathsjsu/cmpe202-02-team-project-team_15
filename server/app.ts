import express from 'express';
import cors from 'cors';

// Import models to ensure they're registered with Mongoose
import './models/User';
import './models/Category';
import './models/Listing';

// Import routes
import searchRoutes from './routes/searchRoutes';
import listingsRoutes from './routes/listings';

export const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/listings', searchRoutes);
app.use('/api/listings', listingsRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Campus Marketplace API' });
});
