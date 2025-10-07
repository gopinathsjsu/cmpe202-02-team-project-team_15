# Campus Marketplace Frontend

A modern React TypeScript frontend for the Campus Marketplace application, designed to match the provided Shop.png mockup.

## Features

- **Modern UI Design**: Clean, responsive interface matching the provided design
- **Search & Filter**: Full-text search with category and price range filtering
- **Sorting Options**: Sort by newest, price ascending, or price descending
- **Pagination**: Navigate through multiple pages of results
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **TypeScript**: Full type safety throughout the application
- **Loading States**: Skeleton loading animations for better UX

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running on `http://localhost:5000`

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Start the development server:**
```bash
npm start
```

The application will open at `http://localhost:3000`.

## Project Structure

```
frontend/
├── public/
│   └── placeholder-image.svg    # Placeholder for missing product images
├── src/
│   ├── components/              # React components
│   │   ├── SearchBar.tsx       # Search input and sorting options
│   │   ├── CategoryFilter.tsx  # Category dropdown filter
│   │   ├── PriceRangeFilter.tsx # Price range slider
│   │   ├── ProductGrid.tsx     # Grid layout for products
│   │   ├── ProductCard.tsx     # Individual product card
│   │   └── Pagination.tsx      # Pagination controls
│   ├── services/
│   │   └── api.ts              # API client service
│   ├── App.tsx                 # Main application component
│   ├── App.css                 # Application styles
│   └── index.tsx               # Application entry point
└── package.json
```

## Components

### SearchBar
- Text search input with search button
- Sorting options (New, Price ascending, Price descending)
- Responsive design that stacks on mobile

### CategoryFilter
- Dropdown selection for product categories
- Fetches categories from the backend API
- "All Categories" option to clear filter

### PriceRangeFilter
- Dual-range slider for min/max price selection
- Real-time price display
- Automatic constraint handling (min ≤ max)

### ProductGrid
- Responsive grid layout
- Loading skeleton animations
- Empty state handling
- Hover effects for better interactivity

### ProductCard
- Product image with fallback to placeholder
- Product title and price display
- Click handler for future product detail views

### Pagination
- Previous/Next navigation
- Page number buttons with ellipsis for large page counts
- Responsive design

## API Integration

The frontend communicates with the backend API at `http://localhost:5000`:

- `GET /api/listings/search` - Search and filter listings
- `GET /api/listings/categories` - Get all categories
- `GET /api/listings/:id` - Get single listing (for future use)

## Styling

The application uses custom CSS with:
- Modern design system with consistent spacing and colors
- Responsive breakpoints for mobile, tablet, and desktop
- Smooth animations and transitions
- Loading skeleton animations
- Hover effects and interactive states

## Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Running with Backend

1. Start the backend server (from the `server` directory):
```bash
cd ../server
npm run dev
```

2. Start the frontend (from the `frontend` directory):
```bash
npm start
```

## Design Implementation

The frontend closely follows the provided Shop.png mockup:

- **Layout**: Left sidebar with filters, main content area with search and products
- **Search Bar**: Centered search input with sorting buttons on the right
- **Filters**: Category dropdown and price range slider in sidebar
- **Product Grid**: 3-column responsive grid with product cards
- **Pagination**: Bottom pagination with Previous/Next and page numbers
- **Colors**: Modern color scheme with blue accents (#007bff)
- **Typography**: Clean, readable fonts with proper hierarchy

## Future Enhancements

- Product detail modal/page
- User authentication
- Shopping cart functionality
- Product image upload
- Advanced filtering options
- Search suggestions/autocomplete
- Favorites/wishlist functionality

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

The application is built with modern web standards and should work in all current browsers.