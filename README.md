# CMPE 202 Team Project - Authentication & User Management API

A comprehensive MERN stack application providing authentication and user management functionality with role-based access control, campus-based user registration, and comprehensive audit logging.

## 🚀 Features

### Authentication & Security
- **User Registration** with email domain validation
- **Email Verification** system
- **JWT-based Authentication** with refresh tokens
- **Password Reset** functionality
- **Rate Limiting** for login attempts
- **Session Management** with device tracking
- **Comprehensive Audit Logging**

### User Management
- **Role-based Access Control** (Buyer, Seller, Admin)
- **Campus-based Registration** with domain validation
- **User Status Management** (Pending, Active, Suspended, Deleted)
- **Profile Management**

### Admin Features
- **User Management Dashboard**
- **Campus Management**
- **Audit Log Monitoring**
- **Session Management**
- **Login Attempt Tracking**
- **System Statistics**

## 📋 Database Schema

The application implements the following entities based on the provided schema:

- **Users** - Core user information with campus association
- **Campuses** - Educational institutions with email domains
- **Roles** - User roles (buyer, seller, admin)
- **UserRoles** - Many-to-many relationship between users and roles
- **Sessions** - JWT refresh token management
- **EmailVerifications** - Email verification tokens
- **PasswordResets** - Password reset tokens
- **LoginAttempts** - Login attempt logging for security
- **AuditLog** - Comprehensive activity logging
- **UserStatus** - User account status tracking

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/gopinathsjsu/cmpe202-02-team-project-team_15.git
cd cmpe202-02-team-project-team_15
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cmpe202_project
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# macOS with Homebrew
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 5. Seed the Database
Initialize the database with default roles and sample campuses:
```bash
npm run seed
```

### 6. Start the Server
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "student@sjsu.edu",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "campus_id": "campus_object_id"
}
```

#### Verify Email
```http
POST /auth/verify-email
Content-Type: application/json

{
  "token": "verification_token_from_email"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "student@sjsu.edu",
  "password": "SecurePass123!"
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

#### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "student@sjsu.edu"
}
```

#### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!"
}
```

### User Endpoints

#### Get Profile
```http
GET /users/profile
Authorization: Bearer <access_token>
```

#### Update Profile
```http
PUT /users/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith"
}
```

#### Get All Users (Admin Only)
```http
GET /users?page=1&limit=10&status=active&search=john
Authorization: Bearer <access_token>
```

#### Assign Role (Admin Only)
```http
POST /users/:userId/roles
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "role_id": "role_object_id"
}
```

### Campus Endpoints

#### Get All Campuses
```http
GET /campus
```

#### Create Campus (Admin Only)
```http
POST /campus
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "University of California, Davis",
  "email_domain": "ucdavis.edu"
}
```

### Admin Endpoints

#### Dashboard Statistics
```http
GET /admin/dashboard
Authorization: Bearer <access_token>
```

#### Audit Logs
```http
GET /admin/audit-logs?page=1&limit=50&action=LOGIN
Authorization: Bearer <access_token>
```

#### Login Attempts
```http
GET /admin/login-attempts?page=1&limit=50&success=false
Authorization: Bearer <access_token>
```

#### Active Sessions
```http
GET /admin/sessions?page=1&limit=50
Authorization: Bearer <access_token>
```

## 🔒 Security Features

### Rate Limiting
- **5 failed attempts per email** in 5 minutes
- **20 failed attempts per IP** in 1 hour

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Token Security
- **Access tokens**: 15-minute expiry
- **Refresh tokens**: 7-day expiry
- **Email verification**: 24-hour expiry
- **Password reset**: 1-hour expiry

### Audit Logging
All significant actions are logged including:
- User registration and verification
- Login/logout events
- Role assignments
- Password changes
- Administrative actions

## 🏗️ Project Structure

```
├── config/
│   └── database.js          # MongoDB connection
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── validation.js        # Input validation
│   └── rateLimiting.js      # Rate limiting logic
├── models/
│   ├── User.js              # User model
│   ├── Campus.js            # Campus model
│   ├── Role.js              # Role model
│   ├── UserRole.js          # User-Role relationship
│   ├── Session.js           # Session management
│   ├── EmailVerification.js # Email verification tokens
│   ├── PasswordReset.js     # Password reset tokens
│   ├── LoginAttempt.js      # Login attempt logging
│   ├── AuditLog.js          # Audit logging
│   ├── UserStatus.js        # User status tracking
│   └── index.js             # Model exports
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   ├── campus.js            # Campus management routes
│   └── admin.js             # Admin routes
├── scripts/
│   └── seed.js              # Database seeding
├── server.js                # Main server file
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Test Registration Flow
1. Get available campuses: `GET /api/campus`
2. Register user: `POST /api/auth/register`
3. Verify email: `POST /api/auth/verify-email`
4. Login: `POST /api/auth/login`
5. Access protected routes with JWT token

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-db-url
JWT_SECRET=your-super-secure-production-secret
CLIENT_URL=https://your-frontend-domain.com
```

### Docker Deployment (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 👥 Team

CMPE 202 - Team 15
San Jose State University

---

For questions or support, please contact the development team.