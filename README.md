# Campus Marketplace - TypeScript Version

A campus marketplace application built with MERN stack, now fully converted to TypeScript for better type safety and developer experience.

## Features

- **Search and Filter Listings**: Full-text search with category and price filtering
- **User Management**: Student and admin roles
- **Category Management**: Organized product categories
- **TypeScript**: Full type safety throughout the application

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start MongoDB (make sure it's running on `mongodb://localhost/campus-marketplace`)

3. Seed the database with sample data:
```bash
npm run seed
```

## Development

### Running the Application

- **Development mode** (with hot reload):
```bash
npm run dev
```

- **Development mode with file watching**:
```bash
npm run dev:watch
```

- **Production build**:
```bash
npm run build
npm start
```

### Testing

Run the API tests:
```bash
# Test basic API functionality
npx ts-node test-api.ts

# Test search requirements
npx ts-node test-search.ts
```

## API Endpoints

### Search Listings
- `GET /api/listings/search` - Search and filter listings
  - Query parameters:
    - `q` - Search query (text search on title and description)
    - `category` - Filter by category name or ID
    - `minPrice` - Minimum price filter
    - `maxPrice` - Maximum price filter
    - `sort` - Sort order (`createdAt_desc`, `createdAt_asc`, `price_desc`, `price_asc`)
    - `page` - Page number (default: 1)
    - `pageSize` - Items per page (default: 20)

### Categories
- `GET /api/listings/categories` - Get all available categories

### Basic
- `GET /` - Basic API information

## TypeScript Features

- **Strict Type Checking**: All code is fully typed with strict TypeScript configuration
- **Interface Definitions**: Comprehensive interfaces for all data models and API responses
- **Type Safety**: Request/response types for all API endpoints
- **Mongoose Integration**: Properly typed Mongoose schemas and models

## Project Structure

```
├── models/           # Mongoose models (TypeScript)
├── routes/           # Express routes (TypeScript)
├── types/            # TypeScript type definitions
├── server.ts         # Main application entry point
├── seed.ts           # Database seeding script
├── test-api.ts       # API testing script
├── test-search.ts    # Search functionality testing
├── tsconfig.json     # TypeScript configuration
└── package.json      # Dependencies and scripts
```

## Database Schema

### User
- `name`: String (required, max 100 chars)
- `email`: String (required, unique, lowercase)
- `role`: Enum ['student', 'admin'] (default: 'student')
- `campusId`: String (required)

### Category
- `name`: String (required, unique)
- `description`: String (optional)

### Listing
- `userId`: ObjectId (ref: User)
- `categoryId`: ObjectId (ref: Category)
- `title`: String (required, max 100 chars)
- `description`: String (required, max 1000 chars)
- `price`: Number (required, min: 0)
- `status`: Enum ['ACTIVE', 'SOLD'] (default: 'ACTIVE')
- `photos`: Array of photo objects

## Development Notes

- All JavaScript files have been converted to TypeScript
- Original `.js` files have been removed after successful conversion
- Type definitions are centralized in the `types/` directory
- Strict TypeScript configuration ensures type safety
- Mongoose models are properly typed with interfaces
- Express routes have typed request/response objects

## Migration from JavaScript

The application has been fully migrated from JavaScript to TypeScript while maintaining 100% functional compatibility. All existing functionality remains unchanged, but now benefits from:

- Compile-time type checking
- Better IDE support and autocomplete
- Improved code documentation through types
- Reduced runtime errors
- Better refactoring capabilities
