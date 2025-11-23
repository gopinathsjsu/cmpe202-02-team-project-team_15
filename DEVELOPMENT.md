# Development Guide

## Quick Start

1. **Install dependencies for all projects:**
   ```bash
   npm run install:all
   ```

2. **Start development servers:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Client: http://localhost:3000
   - Backend API: http://localhost:5000

## Project Structure

```
campus-market/
├── server/          # Backend API (Node.js + Express + MongoDB)
├── client/          # Client (HTML + CSS + JavaScript + Tailwind)
├── package.json     # Root package.json with management scripts
└── README.md        # Main documentation
```

## Development Commands

### Root Level Commands
- `npm run install:all` - Install all dependencies
- `npm run dev` - Start both client and backend
- `npm run dev:server` - Start only backend
- `npm run dev:client` - Start only client
- `npm run build` - Build both projects
- `npm run start` - Start production server

### Backend Development
```bash
cd server
npm run dev      # Start with hot reload
npm run build    # Build TypeScript
npm run seed     # Seed database
```

### Client Development
```bash
cd client
npm run dev              # Start development server
npm run build:css        # Build Tailwind CSS
npm run build:css:watch  # Watch and build CSS
```

## Environment Setup

1. **Backend Environment Variables** (create `server/.env`):
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/campus-market
   JWT_SECRET=your_jwt_secret_key_here
   CLIENT_URL=http://localhost:3000
   
   # AWS S3 Configuration (Required for image uploads)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_key_here
   AWS_BUCKET_NAME=your-bucket-name
   
   # Optional: CloudFront/CDN URL
   S3_PUBLIC_BASE_URL=https://your-cloudfront-domain.cloudfront.net
   ```

2. **Database**: Make sure MongoDB is running locally or use MongoDB Atlas

3. **AWS S3**: 
   - Create S3 bucket in AWS Console
   - Configure CORS (see `S3_SECURITY_CHECKLIST.md`)
   - Set up AWS credentials
   - (Optional) Configure CloudFront for CDN

## API Endpoints

- `GET /health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

## Client Pages

- `/login.html` - Login page
- `/signup.html` - Sign up page
- `/dashboard.html` - User dashboard

## Technology Stack

### Backend
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs for password hashing

### Client
- HTML5 + CSS3 + JavaScript
- Tailwind CSS for styling
- Responsive design
- Form validation

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 3000 and 5000 are available
2. **Database connection**: Ensure MongoDB is running
3. **Dependencies**: Run `npm run install:all` if you encounter module errors
4. **Build errors**: Check TypeScript compilation with `npm run build`
