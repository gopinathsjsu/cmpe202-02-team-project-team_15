# AWS S3 Integration for Image Uploads

## Overview
This document describes the AWS S3 integration for secure image uploads in the Campus Market application.

## Architecture
- **Presigned URLs**: Secure, temporary upload URLs generated server-side
- **Direct Upload**: Files uploaded directly to S3 from the client
- **Security**: No credentials exposed to the frontend

## Implementation

### Backend

#### Dependencies
```json
{
  "@aws-sdk/client-s3": "^3.x"
}
```

#### Configuration
Create `server/.env`:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your-bucket-name
```

#### Files
- `server/utils/s3.ts` - S3 client and presigned URL generation
- `server/handlers/uploadHandler.ts` - Upload endpoint handlers
- `server/routes/upload.ts` - Upload API routes

### Frontend

#### Files
- `client/src/components/ImageUpload.tsx` - Image upload component
- `client/src/services/api.ts` - API methods for upload flow
- `client/src/pages/CreateListing.tsx` - Create listing with S3 upload
- `client/src/pages/EditListing.tsx` - Edit listing with S3 upload

## Upload Flow

1. **Client requests presigned URL** from `/api/upload/presigned-url`
2. **Server generates presigned URL** for S3 upload
3. **Client uploads file directly** to S3 using presigned URL
4. **Client saves file URL** to listing database

## API Endpoints

### POST /api/upload/presigned-url
Generate presigned URL for single file upload.

**Request:**
```json
{
  "fileName": "image.jpg",
  "fileType": "image/jpeg",
  "fileSize": 1024000,
  "folder": "listings"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/...",
    "fileUrl": "https://your-bucket.s3.amazonaws.com/...",
    "key": "listings/unique-key.jpg"
  }
}
```

### POST /api/upload/presigned-urls/batch
Generate multiple presigned URLs for batch upload.

## Security

- Presigned URLs expire after 1 hour
- Files validated before upload (type, size)
- Proper CORS configuration on S3 bucket
- Bucket policy restricts public access

## Bucket Configuration

### CORS Policy
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Bucket Policy
See `S3_BUCKET_POLICY.json` for the complete policy.

## Error Handling

- Network failures during upload
- Invalid file types or sizes
- S3 service errors
- Expired presigned URLs

## Testing

1. Start the application
2. Navigate to Create Listing
3. Click "Upload Images"
4. Select images
5. Verify upload to S3
6. Check file URLs in database

## Troubleshooting

Common issues and solutions:
- **CORS errors**: Check S3 bucket CORS configuration
- **Access denied**: Verify AWS credentials and bucket policy
- **Upload timeout**: Increase presigned URL expiration time
- **Large files**: Configure chunked upload for files > 5MB
