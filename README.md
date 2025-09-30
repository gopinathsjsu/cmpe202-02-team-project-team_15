# Campus Marketplace - TypeScript Version

A campus marketplace application built with MERN stack, featuring a custom ID system and clean architecture with TypeScript for better type safety and developer experience.

## Features

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

## Installation

1. **Clone the repository and navigate to the server directory:**
```bash
cd server
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start MongoDB** (make sure it's running on `mongodb://localhost/campus-marketplace`)

4. **Seed the database with sample data:**
```bash
npm run seed
```

## Development

### Running the Application

- **Development mode** (with hot reload):
```bash
npm run dev
```

- **Development mode with file watching:**
```bash
npm run dev:watch
```

- **Production build:**
```bash
npm run build
npm start
```

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
server/
├── handlers/           # Business logic handlers
│   └── search.ts      # Search, categories, and listing handlers
├── routes/            # Express route definitions
│   └── searchRoutes.ts # Route configurations
├── models/            # Mongoose models (TypeScript)
│   ├── User.ts
│   ├── Category.ts
│   └── Listing.ts
├── types/             # TypeScript type definitions
│   └── index.ts
├── tests/             # API testing scripts
│   ├── test-api.ts
│   ├── test-search.ts
│   └── test-get-listing.ts
├── dist/              # Compiled JavaScript output
├── server.ts          # Main application entry point
├── seed.ts            # Database seeding script
├── tsconfig.json      # TypeScript configuration
└── package.json       # Dependencies and scripts
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

## Getting Started

1. Install dependencies: `npm install`
2. Start MongoDB
3. Seed the database: `npm run seed`
4. Start development server: `npm run dev`
5. Test the API: `npm run test:api`

Your campus marketplace API will be running on `http://localhost:5000`!