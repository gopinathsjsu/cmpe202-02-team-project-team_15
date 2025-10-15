# 🚀 MERN Stack Campus Market Application

## 📋 Technology Stack

### **M**ongoDB
- Database for storing user data, sessions, and application data
- Mongoose ODM for database operations
- Local MongoDB instance running on port 27017

### **E**xpress.js
- Backend API server
- RESTful API endpoints for authentication
- JWT token-based authentication
- CORS enabled for cross-origin requests

### **R**eact.js
- Modern React 18 with TypeScript
- React Router for navigation
- Context API for state management
- Axios for API calls
- Tailwind CSS for styling

### **N**ode.js
- Runtime environment for both client and backend
- npm for package management
- Concurrently for running multiple servers

## 🏗️ Project Structure

```
campus-market/
├── server/                 # Backend (Express.js + MongoDB)
│   ├── controllers/       # Business logic
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/        # Authentication & validation
│   └── scripts/          # Database utilities
├── client/               # Client (React.js)
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React Context (Auth)
│   │   └── services/     # API services
│   └── public/           # Static assets
└── client/               # Legacy HTML client (deprecated)
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start MongoDB:**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

3. **Run the application:**
   ```bash
   npm run dev
   ```

This will start:
- **Backend server** on `http://localhost:5000`
- **React client** on `http://localhost:3000`

## 🔧 Development

### Backend Development
```bash
cd server
npm run dev          # Start backend server
npm run build        # Build TypeScript
npm run seed         # Seed database
```

### Client Development
```bash
cd client
npm start           # Start React development server
npm run build       # Build for production
npm test            # Run tests
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## 🎨 Client Features

### Components
- **Login** - User authentication
- **Signup** - User registration
- **Dashboard** - Main application interface
- **ProtectedRoute** - Route protection

### State Management
- **AuthContext** - Global authentication state
- **Local Storage** - Token persistence
- **Axios Interceptors** - Automatic token refresh

## 🔐 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation
- Rate limiting
- Session management

## 🗄️ Database Models

- **User** - User accounts and profiles
- **Session** - Active user sessions
- **AuditLog** - User activity tracking
- **Role** - User permissions
- **UserRole** - User-role assignments

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
Create `.env` files in the server directory:
```
MONGODB_URI=mongodb://localhost:27017/campus-market
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
```

## 🧪 Testing

### Test User
- **Email:** `properuser@sjsu.edu`
- **Password:** `TestPass123!`

### Database Scripts
```bash
cd server
node scripts/check-database.js      # View all database entries
node scripts/create-user-properly.js # Create test user
node scripts/test-full-login-flow.js # Test login flow
```

## 📚 Key Features

✅ **MERN Stack Architecture**  
✅ **TypeScript Support**  
✅ **JWT Authentication**  
✅ **React Router Navigation**  
✅ **Responsive Design**  
✅ **API Integration**  
✅ **State Management**  
✅ **Protected Routes**  
✅ **Form Validation**  
✅ **Error Handling**  

## 🔄 Migration from HTML to React

The application has been migrated from vanilla HTML/CSS/JavaScript to a modern React application while maintaining the same functionality and design.

**Old Client:** `client/` (HTML/CSS/JS)  
**New Client:** `client/` (React/TypeScript)  

Both can coexist during the transition period.
