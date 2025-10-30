# Files to Copy for S3 Integration + Save Listings Feature

## S3 Integration Files:

### Server - S3 Utility:
1. `server/utils/s3.ts` - NEW FILE - S3 client and presigned URL generation

### Server - Upload Handler:
2. `server/handlers/uploadHandler.ts` - MODIFIED - AWS S3 upload handling

### Server - Upload Routes:
3. `server/routes/upload.ts` - MODIFIED - Upload API routes

### Server App:
4. `server/app.ts` - MODIFIED - Added upload routes registration

### Client - Image Upload Component:
5. `client/src/components/ImageUpload.tsx` - MODIFIED - S3 upload UI component

### Client - API Service:
6. `client/src/services/api.ts` - MODIFIED - Added upload methods and saved listings methods

### Client - Create Listing Page:
7. `client/src/pages/CreateListing.tsx` - MODIFIED - Integrated S3 upload

### Client - Edit Listing Page:
8. `client/src/pages/EditListing.tsx` - MODIFIED - Integrated S3 upload

### Configuration:
9. `server/env.example` - MODIFIED - Added AWS credentials
10. `S3_BUCKET_POLICY.json` - NEW FILE - S3 bucket policy configuration
11. `.gitignore` - MODIFIED - Added S3 exclusion patterns

---

## Save Listings Feature Files:

### Server - Model:
12. `server/models/SavedListing.ts` - NEW FILE - Saved listing schema

### Server - Models Index:
13. `server/models/index.ts` - MODIFIED - Exported SavedListing model

### Server - Handler:
14. `server/handlers/savedListingHandler.ts` - NEW FILE - Save listings API handlers

### Server - Routes:
15. `server/routes/savedListings.ts` - NEW FILE - Save listings API routes

### Server App:
16. `server/app.ts` - MODIFIED - Added saved listings routes (already included above)

### Client - Product Card:
17. `client/src/components/ProductCard.tsx` - MODIFIED - Added heart button for saving

### Client - Product Grid:
18. `client/src/components/ProductGrid.tsx` - MODIFIED - Added saved listing support

### Client - Saved Listings Page:
19. `client/src/pages/SavedListings.tsx` - NEW FILE - View all saved listings

### Client - Search Page:
20. `client/src/pages/SearchPage.tsx` - MODIFIED - Added saved listings integration

### Client - View Listing Page:
21. `client/src/pages/ViewListing.tsx` - MODIFIED - Added saved link to header

### Client - App Routes:
22. `client/src/App.tsx` - MODIFIED - Added saved listings route (already included above)

### Client - API Service:
23. `client/src/services/api.ts` - MODIFIED - Added saved listings methods (already included above)

---

## Optional Package Dependencies:
24. `server/package.json` - MODIFIED - Added @aws-sdk/client-s3 dependency
25. `server/package-lock.json` - MODIFIED - Updated dependencies

