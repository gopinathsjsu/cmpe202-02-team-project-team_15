# Save Listings Feature

## Overview
The Save Listings feature allows buyers to save/favorite listings for later viewing. Saved listings are stored in the database and can be accessed from any page.

## Features

### User Actions
- **Save** a listing by clicking the heart icon on any listing card
- **View Saved** listings from the dedicated page
- **Unsave** listings by clicking the heart icon again
- **Navigate** to saved listings from any page header

## Implementation

### Backend

#### Database Model
**File**: `server/models/SavedListing.ts`

```typescript
interface ISavedListing {
  userId: ObjectId;      // Who saved it
  listingId: ObjectId;   // What listing
  saved_at: Date;       // When saved
}
```

- Compound unique index on `userId + listingId` to prevent duplicates
- Indexed by `userId` for fast retrieval

#### API Endpoints

**POST /api/saved-listings**
Save a listing for the authenticated user.

**Request:**
```json
{
  "listingId": "listing_id_here"
}
```

**Response:**
```json
{
  "message": "Listing saved successfully",
  "savedListing": {
    "id": "saved_listing_id",
    "listingId": "listing_id",
    "savedAt": "2025-10-29T..."
  }
}
```

**DELETE /api/saved-listings/:listingId**
Unsave a listing.

**GET /api/saved-listings**
Get all saved listings with full details.

**Response:**
```json
{
  "savedListings": [
    {
      "savedId": "saved_id",
      "savedAt": "2025-10-29T...",
      "listing": { /* full listing object */ }
    }
  ],
  "count": 5
}
```

**GET /api/saved-listings/check/:listingId**
Check if a specific listing is saved.

**GET /api/saved-listings/ids**
Get just the listing IDs for quick lookup.

**Files:**
- `server/models/SavedListing.ts` - Database model
- `server/handlers/savedListingHandler.ts` - API handlers
- `server/routes/savedListings.ts` - Routes configuration

### Frontend

#### Components

**ProductCard** (`client/src/components/ProductCard.tsx`)
- Heart icon button in top-right corner
- Filled red heart when saved, outline when not
- Hover animations and loading state

**SavedListings Page** (`client/src/pages/SavedListings.tsx`)
- Shows all saved listings in a grid
- Empty state with call-to-action
- Real-time removal when unsaving

**ProductGrid** (`client/src/components/ProductGrid.tsx`)
- Supports saved listing state
- Passes save state to cards

#### Pages Updated
- `SearchPage` - Load saved listing IDs on page load
- `ViewListing` - Added "Saved" link to header
- `Messages` - Added "Saved" link to header
- `App.tsx` - Added `/saved` route

## User Experience

### Visual Feedback
- ❤️ Filled red heart = Saved
- 🤍 Outline heart = Not saved
- Loading state during save/unsave operation
- Toast notifications for success/error (future enhancement)

### Navigation
- "Saved" link appears in all page headers
- Direct URL: `/saved`
- One-click access from anywhere

### Performance
- Saved listing IDs loaded once per page
- Local state updates instantly
- No page refresh needed

## Data Flow

1. **Page Load**: Fetch saved listing IDs for current user
2. **Display**: Show saved state on each listing card
3. **Save Action**: 
   - User clicks heart
   - API call to save/unsave
   - Update local state
   - Update UI immediately
4. **View Saved**: Navigate to saved listings page
5. **Quick Lookup**: Use saved IDs set for instant check

## API Integration

### Methods in `apiService`

```typescript
saveListing(listingId: string): Promise<SavedListing>
unsaveListing(listingId: string): Promise<void>
getSavedListings(): Promise<SavedListingsResponse>
checkIfSaved(listingId: string): Promise<boolean>
getSavedListingIds(): Promise<string[]>
```

## Authentication

All endpoints require authentication via JWT token. The middleware extracts the user ID from the token.

## Error Handling

- Duplicate saves handled gracefully
- Network errors show user-friendly messages
- Invalid listing IDs return 404
- Unauthorized requests return 401

## Future Enhancements

- [ ] Save count per listing
- [ ] Share saved lists with friends
- [ ] Add notes to saved listings
- [ ] Email notifications for price drops
- [ ] Sort/filter saved listings

## Testing

1. Create a test account
2. Browse listings
3. Save multiple listings
4. Navigate to `/saved`
5. Verify all saved listings appear
6. Unsave a listing
7. Verify it disappears immediately
8. Check heart icons update across pages

## Database Queries

**Get user's saved listings:**
```javascript
SavedListing.find({ userId }).populate('listingId').sort({ saved_at: -1 })
```

**Check if saved:**
```javascript
SavedListing.findOne({ userId, listingId })
```

**Get saved IDs only:**
```javascript
SavedListing.find({ userId }).select('listingId')
```

