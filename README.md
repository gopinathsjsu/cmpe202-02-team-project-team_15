# Campus Marketplace - Full Stack Application

A modern campus marketplace application built with React TypeScript frontend and Node.js backend.

## Features

### Frontend (React TypeScript)
- **Search & Filter**: Real-time search with category dropdown and price range slider
- **Sorting Options**: Sort by newest, price ascending, or price descending
- **Pagination**: Navigate through multiple pages of results
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Loading States**: Smooth skeleton animations for better user experience

### Backend (Node.js TypeScript)
- **Search and Filter Listings**: Full-text search with category and price filtering
- **Custom ID System**: Human-readable listing IDs (LST-YYYYMMDD-XXXX format)
- **User Management**: Student and admin roles
- **Category Management**: Organized product categories
- **Clean Architecture**: Separated handlers and routes for better maintainability
- **TypeScript**: Full type safety throughout the application
- **Comprehensive Testing**: API tests for all endpoints

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- npm or yarn

## Quick Start

### Option 1: Run Everything at Once (Recommended)

1. **Install all dependencies:**
```bash
npm run install-all
```

2. **Start MongoDB** (make sure it's running on `mongodb://localhost/campus-marketplace`)

3. **Seed the database with sample data:**
```bash
npm run seed
```

4. **Start both frontend and backend:**
```bash
npm run dev
```

This will start:
- Backend API server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

### Option 2: Run Separately

#### Backend Setup
1. **Navigate to server directory and install dependencies:**
```bash
cd server
npm install
```

2. **Start MongoDB** and **seed the database:**
```bash
npm run seed
```

3. **Start the backend:**
```bash
npm run dev
```

#### Frontend Setup
1. **Navigate to frontend directory and install dependencies:**
```bash
cd frontend
npm install
```

2. **Start the frontend:**
```bash
npm start
```

## Development

### Available Scripts (Root Level)

- `npm run dev` - Start both frontend and backend concurrently
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend
- `npm run install-all` - Install dependencies for root, server, and frontend
- `npm run seed` - Seed the database with sample data
- `npm run build` - Build frontend for production

### Backend Scripts (server/)

- `npm run dev` - Start backend in development mode with hot reload
- `npm run dev:watch` - Start backend with file watching
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data

### Testing

Run the comprehensive API tests:
```bash
# Test basic API functionality
npm run test:api

# Test search requirements (US-SEARCH-1)
npm run test:search

# Test individual listing retrieval
npm run test:get-listing
```

Or run individual test files:
```bash
npx ts-node tests/test-api.ts
npx ts-node tests/test-search.ts
npx ts-node tests/test-get-listing.ts
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

### Basic
- `GET /` - Basic API information

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

## Project Structure

```
campus-marketplace-app/
├── frontend/                    # React TypeScript Frontend
│   ├── public/
│   │   └── placeholder-image.svg # Placeholder for missing product images
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── SearchBar.tsx    # Search input and sorting options
│   │   │   ├── CategoryFilter.tsx # Category dropdown filter
│   │   │   ├── PriceRangeFilter.tsx # Price range slider
│   │   │   ├── ProductGrid.tsx  # Grid layout for products
│   │   │   ├── ProductCard.tsx  # Individual product card
│   │   │   └── Pagination.tsx   # Pagination controls
│   │   ├── services/
│   │   │   └── api.ts           # API client service
│   │   ├── App.tsx              # Main application component
│   │   ├── App.css              # Application styles
│   │   └── index.tsx            # Application entry point
│   └── package.json
├── server/                      # Node.js TypeScript Backend
│   ├── handlers/                # Business logic handlers
│   │   └── search.ts           # Search, categories, and listing handlers
│   ├── routes/                 # Express route definitions
│   │   └── searchRoutes.ts     # Route configurations
│   ├── models/                 # Mongoose models (TypeScript)
│   │   ├── User.ts
│   │   ├── Category.ts
│   │   └── Listing.ts
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts
│   ├── tests/                  # API testing scripts
│   │   ├── test-api.ts
│   │   ├── test-search.ts
│   │   └── test-get-listing.ts
│   ├── dist/                   # Compiled JavaScript output
│   ├── server.ts               # Main application entry point
│   ├── seed.ts                 # Database seeding script
│   ├── tsconfig.json           # TypeScript configuration
│   └── package.json            # Dependencies and scripts
└── package.json                 # Root package.json with convenience scripts
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

## Architecture

The application follows a clean architecture pattern:

1. **Routes** (`routes/`): Define API endpoints and import handlers
2. **Handlers** (`handlers/`): Contain business logic and database operations
3. **Models** (`models/`): Define database schemas and types
4. **Types** (`types/`): Centralized TypeScript type definitions

This separation provides:
- Better maintainability
- Easier testing
- Clear separation of concerns
- Improved code organization

## Development Notes

- All JavaScript files have been converted to TypeScript
- Custom ID system implemented for better user experience (no MongoDB warnings)
- Clean architecture with separated handlers and routes
- Comprehensive test suite for all API endpoints
- Strict TypeScript configuration ensures type safety
- Mongoose models are properly typed with interfaces
- Express routes have typed request/response objects
- Dual ID system: MongoDB `_id` + custom `listingId` for optimal compatibility

## Migration from JavaScript

The application has been fully migrated from JavaScript to TypeScript while maintaining 100% functional compatibility. All existing functionality remains unchanged, but now benefits from:

- Compile-time type checking
- Better IDE support and autocomplete
- Improved code documentation through types
- Reduced runtime errors
- Better refactoring capabilities
- Custom ID system for better user experience
- Clean architecture for better maintainability

## Sample Data

The seed script creates:
- 5 sample users (4 students, 1 admin)
- 8 product categories
- 12 sample listings with realistic data

Run `npm run seed` to populate your database with sample data for testing and development.

## Testing Coverage

The test suite covers:
- Basic API functionality
- Search and filtering (US-SEARCH-1 requirements)
- Individual listing retrieval by custom listingId
- Custom listingId validation and format checking
- Error handling for invalid/missing IDs
- Response structure validation (both _id and listingId)
- Pagination
- Category filtering
- Price range filtering
- Sorting options
- MongoDB compatibility (no warnings)

## Frontend Design Implementation

The React frontend closely follows the provided Shop.png mockup with modern enhancements:

### Layout & Structure
- **Sidebar**: Left-aligned filters (Category dropdown, Price range slider)
- **Main Content**: Search bar with sorting options, product grid, pagination
- **Responsive Design**: Sidebar moves below content on mobile devices

### Visual Design
- **Color Scheme**: Modern blue accent (#007bff) with clean grays and whites
- **Typography**: Clean, readable fonts with proper hierarchy
- **Cards**: Elevated product cards with hover effects and shadows
- **Buttons**: Consistent button styling with hover states

### User Experience
- **Loading States**: Skeleton animations while data loads
- **Error Handling**: User-friendly error messages
- **Interactive Elements**: Hover effects, smooth transitions
- **Accessibility**: Proper ARIA labels and keyboard navigation

### Components Matching Design
- **SearchBar**: Matches the centered search with sorting buttons
- **CategoryFilter**: Dropdown with "Value" placeholder as shown
- **PriceRangeFilter**: Dual-range slider with $0-9999 display
- **ProductGrid**: 3-column responsive grid matching the layout
- **ProductCard**: Clean cards with image, title, and price
- **Pagination**: Bottom pagination with Previous/Next and page numbers

## Getting Started

### Quick Setup (Recommended)
1. **Install all dependencies:** `npm run install-all`
2. **Start MongoDB** (ensure it's running on default port)
3. **Seed the database:** `npm run seed`
4. **Start both frontend and backend:** `npm run dev`

Your application will be running at:
- **Frontend**: `http://localhost:3000` (React app)
- **Backend API**: `http://localhost:5000` (Node.js server)

### Manual Setup
1. Install dependencies: `npm install` (root), then `cd server && npm install`, then `cd ../frontend && npm install`
2. Start MongoDB
3. Seed the database: `npm run seed`
4. Start development servers: `npm run dev`
5. Test the API: `cd server && npm run test:api`
