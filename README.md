# Campus Marketplace - Full Stack Application

A modern, optimized campus marketplace application built with React TypeScript frontend and Node.js backend. Features clean architecture, type safety, and performance optimizations.


## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- npm or yarn
- AWS Account (for S3 image uploads)
  - S3 bucket configured
  - AWS credentials (Access Key ID & Secret Access Key)
  - (Optional) CloudFront distribution for CDN

## Quick Start

### Run Backend and Frontend Separately

#### Backend Setup
1. **Navigate to server directory and install dependencies:**
```bash
cd server
npm install
```

2. **Start the backend:**
```bash
npm run dev
```

#### Frontend Setup
1. **Navigate to client directory and install dependencies:**
```bash
cd client
npm install
```

2. **Start the frontend:**
```bash
npm run dev
```


## API Endpoints

### Search Listings
- `GET /api/listings/search` - Search and filter listings
  - **Query parameters:**
    - `q` - Search query (text search on title and description)
    - `category` - Filter by category name or ID
    - `minPrice` - Minimum price filter
    - `maxPrice` - Maximum price filter
    - `sort` - Sort order (`createdAt_desc`, `createdAt_asc`, `price_desc`, `price_asc`)
    - `page` - Page number (default: 1)
    - `pageSize` - Items per page (default: 20)

### Categories
- `GET /api/listings/categories` - Get all available categories

### Individual Listings
- `GET /api/listings/:id` - Get a single listing by custom listingId
  - **ID Format**: `LST-YYYYMMDD-XXXX` (e.g., `LST-20250930-1234`)
  - **Note**: Uses `listingId` field, not MongoDB's `_id`
- `POST /api/listings` - Create a new listing
- `PUT /api/listings/:id` - Update a listing
- `DELETE /api/listings/:id` - Delete a listing

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### Chat & Messaging
- `GET /api/chats` - Get user conversations
- `POST /api/chats` - Create new conversation
- `GET /api/chats/:id/messages` - Get messages in a conversation
- WebSocket connection for real-time messaging

### Saved Listings
- `GET /api/saved-listings` - Get user's saved listings
- `POST /api/saved-listings` - Save a listing
- `DELETE /api/saved-listings/:id` - Remove saved listing

### Upload
- `POST /api/upload/presigned-url` - Get presigned URL for S3 upload

### Admin
- `GET /api/admin/reports` - Get all reports
- `POST /api/admin/users/:id/suspend` - Suspend a user
- `GET /api/admin/categories` - Manage categories

### Basic
- `GET /` - Basic API information
- `GET /health` - Health check endpoint

## API Response Format

### Listing Response Example:
```json
{
  "_id": "68dba04f28aa972a3c45cc8e",        // MongoDB ObjectId
  "listingId": "LST-20250930-1234",         // Custom human-readable ID
  "title": "MacBook Pro 13\" 2020",
  "description": "Excellent condition MacBook Pro...",
  "price": 1200,
  "status": "ACTIVE",
  "userId": {
    "_id": "68dba04f28aa972a3c45cc8f",
    "name": "John Smith",
    "email": "john.smith@university.edu"
  },
  "categoryId": {
    "_id": "68dba04f28aa972a3c45cc90",
    "name": "Electronics"
  },
  "photos": [...],
  "createdAt": "2025-09-30T10:00:00.000Z",
  "updatedAt": "2025-09-30T10:00:00.000Z"
}
```

### Usage:
- **API Endpoints**: Use `listingId` (e.g., `/api/listings/LST-20250930-1234`)
- **Database Operations**: Can use either `_id` or `listingId` as needed
- **User Interface**: Display `listingId` for better user experience

## 📁 Project Structure

```
campus-marketplace/
├── client/                      # React TypeScript Frontend
│   ├── public/
│   │   └── placeholder-image.svg # Placeholder for missing product images
│   ├── src/
│   │   ├── components/          # Optimized React components
│   │   │   ├── SearchBar.tsx    # Search input with debounced queries
│   │   │   ├── FilterMenu.tsx   # Consolidated filter component
│   │   │   ├── ProductGrid.tsx  # Memoized grid layout
│   │   │   ├── ProductCard.tsx  # Memoized product cards
│   │   │   └── Pagination.tsx   # Responsive pagination controls
│   │   ├── pages/
│   │   │   └── SearchPage.tsx   # Main search page with optimized state management
│   │   ├── services/
│   │   │   └── api.ts           # Type-safe API client service
│   │   ├── App.tsx              # Main application component
│   │   ├── index.css            # Tailwind CSS styles
│   │   └── index.tsx            # Application entry point
│   └── package.json
├── server/                      # Node.js TypeScript Backend
│   ├── handlers/                # Business logic handlers
│   │   ├── authHandler.ts      # Authentication logic
│   │   ├── listingController.ts # Listing CRUD operations
│   │   ├── search.ts            # Search and filtering
│   │   ├── chat.ts              # Chat and messaging
│   │   ├── adminHandler.ts      # Admin operations
│   │   ├── uploadHandler.ts    # Image upload handling
│   │   └── ...                  # Other handlers
│   ├── routes/                  # Express route definitions
│   │   ├── auth.ts              # Authentication routes
│   │   ├── listings.ts          # Listing routes
│   │   ├── chatRoutes.ts        # Chat routes
│   │   ├── admin.ts             # Admin routes
│   │   └── ...                  # Other routes
│   ├── models/                  # Mongoose models
│   │   ├── User.ts              # User model
│   │   ├── Listing.ts           # Listing model
│   │   ├── Category.ts          # Category model
│   │   ├── Conversation.ts     # Chat conversation model
│   │   ├── Message.ts           # Chat message model
│   │   └── ...                  # Other models
│   ├── middleware/             # Express middleware
│   │   ├── auth.ts              # Authentication middleware
│   │   ├── validation.ts       # Request validation
│   │   └── rateLimiting.ts     # Rate limiting
│   ├── services/                # External services
│   │   └── emailService.ts      # Email service
│   ├── utils/                   # Utility functions
│   │   ├── socket.ts            # Socket.io setup
│   │   └── s3.ts                # AWS S3 utilities
│   ├── app.ts                   # Express application setup
│   ├── server.ts                # Server entry point with Socket.io
│   ├── tsconfig.json            # TypeScript configuration
│   └── package.json             # Dependencies
├── UML_COMPONENT_DIAGRAM.puml   # Component diagram
├── UML_DEPLOYMENT_DIAGRAM.puml  # Deployment diagram
└── README.md                     # This file
```

## Database Schema

### User
- `_id`: ObjectId (MongoDB default)
- `name`: String (required, max 100 chars)
- `email`: String (required, unique, lowercase)
- `role`: Enum ['student', 'admin'] (default: 'student')
- `campusId`: String (required)

### Category
- `_id`: ObjectId (MongoDB default)
- `name`: String (required, unique)
- `description`: String (optional)

### Listing
- `_id`: ObjectId (MongoDB default)
- `listingId`: String (custom format: `LST-YYYYMMDD-XXXX`)
- `userId`: ObjectId (ref: User)
- `categoryId`: ObjectId (ref: Category)
- `title`: String (required, max 100 chars)
- `description`: String (required, max 1000 chars)
- `price`: Number (required, min: 0)
- `status`: Enum ['ACTIVE', 'SOLD'] (default: 'ACTIVE')
- `photos`: Array of photo objects

## Custom ID System

The application uses a custom ID system for listings that provides human-readable IDs while maintaining MongoDB compatibility:

### Format: `LST-YYYYMMDD-XXXX`
- **LST**: Listing prefix identifier
- **YYYYMMDD**: Date created (e.g., 20250930)
- **XXXX**: Random 4-digit number (0000-9999)

### Examples:
- `LST-20250930-1234`
- `LST-20250930-5678`
- `LST-20250930-9999`

### Implementation:
- **MongoDB `_id`**: Remains as ObjectId (default MongoDB behavior)
- **Custom `listingId`**: Separate field with human-readable format
- **No Warnings**: Avoids MongoDB index conflicts
- **API Compatibility**: Endpoints use `listingId` for user-facing operations

### Benefits:
- **Human-readable**: Easy to identify and reference
- **Date-based**: Shows when the listing was created
- **Unique**: Random component prevents collisions
- **URL-friendly**: No special characters, safe for URLs
- **Sortable**: Can be sorted chronologically
- **MongoDB Compatible**: No warnings or conflicts with MongoDB's internal structure

## TypeScript Features

- **Strict Type Checking**: All code is fully typed with strict TypeScript configuration
- **Interface Definitions**: Comprehensive interfaces for all data models and API responses
- **Type Safety**: Request/response types for all API endpoints
- **Mongoose Integration**: Properly typed Mongoose schemas and models
- **Clean Architecture**: Separated concerns with typed handlers and routes

## 🏗️ Architecture

The application follows an optimized clean architecture pattern:

1. **Routes** (`routes/`): Define API endpoints and import handlers
2. **Handlers** (`handlers/`): Contain business logic with utility functions and database operations
3. **Models** (`models/`): Self-contained database schemas with embedded TypeScript interfaces
4. **Services** (`client/src/services/`): Type-safe API client layer for frontend

This architecture provides:
- **Better Maintainability**: Types co-located with their usage
- **Improved Performance**: Optimized components and state management
- **Clear Separation**: Distinct layers with specific responsibilities
- **Type Safety**: Full TypeScript coverage throughout the stack

## 📊 UML Diagrams

The project includes UML diagrams to visualize the system architecture and deployment:

### Component Diagram
**File**: `UML_COMPONENT_DIAGRAM.puml`

![Component Diagram](UML%20Component%20Diagram.png)

The component diagram illustrates the software architecture, showing:
- **Client Layer**: React application with pages, components, contexts, and API service
- **Server Layer**: Express backend with routes, handlers, models, services, and utilities
- **External Services**: MongoDB Atlas, AWS S3, Email service, and Google Generative AI
- **Component Relationships**: How different parts of the system interact and depend on each other

### Deployment Diagram
**File**: `UML_DEPLOYMENT_DIAGRAM.puml`

![Deployment Diagram](UML%20Deployment%20Diagram.png)

The deployment diagram shows the infrastructure and deployment architecture:
- **Frontend**: AWS CloudFront CDN serving static files from S3 bucket
- **Backend**: AWS EC2 instance behind Application Load Balancer
- **Database**: MongoDB Atlas cluster
- **External Services**: AWS S3 for image storage, Email service, and Google AI for chatbot
- **Network Flow**: How requests flow from client through CDN/load balancer to backend and database


## Environment Variables

Create a `.env` file in the `server/` directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=8080
CLIENT_URL=http://localhost:3000

# Database
MONGO_URI=mongodb://localhost:27017/campus-marketplace
# Or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/campus-marketplace

# Authentication
JWT_SECRET=your_jwt_secret_key_here

# AWS S3 (for image uploads)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket-name

# Email Service (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Google Generative AI (for chatbot)
GOOGLE_AI_API_KEY=your-google-ai-api-key
```

## Technology Stack

### Frontend
- **React 18.3.1** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - Runtime environment
- **Express.js 5.1.0** - Web framework
- **TypeScript** - Type safety
- **Mongoose 8.19.1** - MongoDB ODM
- **Socket.io 4.8.1** - Real-time WebSocket server
- **AWS SDK** - S3 integration for file storage
- **Nodemailer** - Email service
- **Google Generative AI** - Chatbot functionality
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Infrastructure
- **MongoDB Atlas** - Managed database
- **AWS S3** - File storage
- **AWS CloudFront** - CDN for frontend
- **AWS EC2** - Backend hosting
- **AWS Application Load Balancer** - Traffic distribution

## 🔒 Security Features

- JWT token authentication with secure cookies
- Password hashing with bcrypt
- Rate limiting on API endpoints and login attempts
- CORS configuration for secure cross-origin requests
- Input validation and sanitization
- Secure session management
- SSL/TLS encryption (in production)
- AWS S3 presigned URLs for secure file uploads
