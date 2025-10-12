import express from 'express';
import cors from 'cors';
import path from 'path';
import connectDB from './config/database.js';
import { swaggerUi, specs } from './config/swagger.js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import campusRoutes from './routes/campus.js';
import adminRoutes from './routes/admin.js';

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Note: Frontend is served separately from the frontend folder

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CMPE 202 Team Project API'
}));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current status of the server
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Server is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: "development"
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint for testing login
app.post('/debug-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Debug login called with:', { email, password: password ? '***' : 'undefined' });
    
    const { getModels } = await import('./models/index.js');
    const { User } = await getModels();
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found');
      return res.json({ success: false, message: 'User not found' });
    }
    
    console.log('User found:', { email: user.email, status: user.status });
    
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.json({ success: false, message: 'Invalid password' });
    }
    
    if (user.status !== 'active') {
      return res.json({ success: false, message: 'User not active' });
    }
    
    res.json({ success: true, message: 'Login successful', user: { email: user.email, status: user.status } });
    
  } catch (error) {
    console.error('Debug login error:', error);
    res.json({ success: false, message: 'Error: ' + error.message });
  }
});

// Debug endpoint for testing AuthController
app.post('/debug-auth-controller', async (req, res) => {
  try {
    console.log('Debug auth controller called');
    const { AuthHandlers } = await import('./handlers/authHandlers.ts');
    await AuthHandlers.login(req, res);
  } catch (error) {
    console.error('Debug auth controller error:', error);
    res.json({ success: false, message: 'Error: ' + error.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/campus', campusRoutes);
app.use('/api/admin', adminRoutes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API information
 *     description: Returns basic information about the API and available endpoints
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "CMPE 202 Team Project API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     auth:
 *                       type: string
 *                       example: "/api/auth"
 *                     users:
 *                       type: string
 *                       example: "/api/users"
 *                     campus:
 *                       type: string
 *                       example: "/api/campus"
 *                     admin:
 *                       type: string
 *                       example: "/api/admin"
 *                     health:
 *                       type: string
 *                       example: "/health"
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CMPE 202 Team Project API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      campus: '/api/campus',
      admin: '/api/admin',
      health: '/health',
      docs: '/api-docs'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => err.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌐 Frontend: http://localhost:3000`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export default app;
