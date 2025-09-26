const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import models to ensure they're registered with Mongoose
require('./models/User');
require('./models/Category');
require('./models/Listing');

// Import routes
const searchRoutes = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost/campus-marketplace', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

// Routes
app.use('/api/listings', searchRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Campus Marketplace API' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

  