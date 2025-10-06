# Campus Market - Full Stack Application

A modern campus marketplace application built with Node.js, Express, MongoDB, and vanilla HTML/CSS/JavaScript with Tailwind CSS.

## 📁 Project Structure

```
campus-market/
├── server/                 # Backend API Server
│   ├── config/            # Database configuration
│   ├── controllers/       # Business logic controllers
│   ├── middleware/        # Express middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── scripts/          # Database scripts
│   ├── types/            # TypeScript type definitions
│   ├── server.ts         # Main server file
│   ├── tsconfig.json     # TypeScript configuration
│   └── package.json      # Server dependencies
├── frontend/              # Frontend Application
│   ├── public/           # Static HTML files
│   │   ├── login.html    # Login page
│   │   ├── signup.html   # Sign up page
│   │   ├── dashboard.html # Dashboard page
│   │   └── css/          # CSS files
│   ├── src/              # Source files (if needed)
│   ├── tailwind.config.js # Tailwind configuration
│   ├── tsconfig.json     # TypeScript configuration
│   └── package.json      # Frontend dependencies
├── package.json          # Root package.json with scripts
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (running locally or MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd campus-market
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   Create a `.env` file in the `server/` directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/campus-market
   JWT_SECRET=your_jwt_secret_key_here
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend server on http://localhost:3000

## 🛠️ Development

### Available Scripts

#### Root Level Scripts
- `npm run install:all` - Install dependencies for both server and frontend
- `npm run dev` - Start both server and frontend in development mode
- `npm run dev:server` - Start only the backend server
- `npm run dev:frontend` - Start only the frontend server
- `npm run build` - Build both server and frontend
- `npm run start` - Start the production server

#### Server Scripts (in `server/` directory)
- `npm run dev` - Start server with hot reload
- `npm run build` - Compile TypeScript
- `npm run seed` - Seed the database with sample data

#### Frontend Scripts (in `frontend/` directory)
- `npm run dev` - Start frontend development server
- `npm run build:css` - Build Tailwind CSS
- `npm run build:css:watch` - Watch and build CSS

### API Endpoints

The backend provides the following API endpoints:

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

#### Other Endpoints
- `GET /health` - Health check
- `GET /` - API information

### Frontend Pages

- **Login**: http://localhost:3000/login.html
- **Sign Up**: http://localhost:3000/signup.html
- **Dashboard**: http://localhost:3000/dashboard.html

## 🎨 Frontend Features

- **Modern Design**: Clean, responsive UI built with Tailwind CSS
- **Authentication Flow**: Complete login/signup with validation
- **Form Validation**: Client-side and server-side validation
- **Responsive Design**: Works on all screen sizes
- **TypeScript Support**: Type-safe development

## 🔧 Backend Features

- **RESTful API**: Well-structured API endpoints
- **Authentication**: JWT-based authentication with refresh tokens
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Input validation and sanitization
- **Security**: Rate limiting, CORS, and secure headers
- **TypeScript**: Full TypeScript support for better development experience

## 🗄️ Database

The application uses MongoDB with the following main collections:
- Users
- Campus
- Roles
- Sessions
- Email Verifications
- Password Resets
- Audit Logs

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on login attempts
- CORS configuration
- Input validation and sanitization
- Secure session management

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.