# AWS S3 Image Upload Implementation

## 📋 Overview
This document describes the complete AWS S3 integration for image uploads in the Campus Marketplace application. Users can now upload multiple images (up to 5) directly to AWS S3 for their product listings.

---

## 🎯 Features Implemented

### ✅ Backend (Server)
1. **AWS SDK Integration** - Installed `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
2. **S3 Utility Service** - Comprehensive S3 operations handler
3. **Upload Handler** - API endpoints for presigned URL generation
4. **Upload Routes** - RESTful routes for upload operations
5. **Environment Configuration** - AWS credentials management

### ✅ Frontend (Client)
1. **API Service Updates** - Upload methods for S3 integration
2. **ImageUpload Component** - Reusable image upload component with preview
3. **CreateListing Page** - Updated with file upload functionality
4. **EditListing Page** - Updated with file upload functionality

---

## 📁 Files Created/Modified

### **Backend Files Created:**
1. `server/utils/s3.ts` - S3 utility functions
2. `server/handlers/uploadHandler.ts` - Upload endpoint handlers
3. `server/routes/upload.ts` - Upload routes
4. `server/.env` - Environment variables (AWS credentials)
5. `server/env.example` - Updated with AWS config template

### **Backend Files Modified:**
1. `server/app.ts` - Registered upload routes

### **Frontend Files Created:**
1. `client/src/components/ImageUpload.tsx` - Image upload component

### **Frontend Files Modified:**
1. `client/src/services/api.ts` - Added upload methods
2. `client/src/pages/CreateListing.tsx` - Integrated ImageUpload component
3. `client/src/pages/EditListing.tsx` - Integrated ImageUpload component

---

## 🔧 Technical Implementation

### **Upload Flow (Direct Client-to-S3):**

```
1. User selects images in the browser
2. Frontend validates file type and size
3. Frontend requests presigned URL(s) from backend
4. Backend generates presigned URL(s) with AWS SDK
5. Frontend uploads directly to S3 using presigned URL
6. S3 returns success, frontend displays preview
7. When user submits form, S3 URLs are saved to MongoDB
```

### **Benefits of this approach:**
- ⚡ **Faster uploads** - Direct to S3, no backend bottleneck
- 💰 **Cost efficient** - Less server bandwidth usage
- 🔒 **Secure** - Presigned URLs expire in 5 minutes
- 📈 **Scalable** - No server load for file transfers

---

## 🔐 AWS Configuration

### **S3 Bucket:**
- **Name:** `campus-marketplace-team15`
- **Region:** `us-east-1`
- **Folder Structure:**
  - `listings/` - Product listing images
  - `profiles/` - User profile pictures (future use)

### **CORS Configuration:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:8080"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-server-side-encryption",
      "x-amz-request-id",
      "x-amz-id-2"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

### **IAM Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBucketForCampusMarketplace",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::campus-marketplace-team15"
    },
    {
      "Sid": "ManageListingImages",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::campus-marketplace-team15/listings/*"
    },
    {
      "Sid": "ManageUserProfileImages",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::campus-marketplace-team15/profiles/*"
    }
  ]
}
```

### **Environment Variables (server/.env):**
```env
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=campus-marketplace-team15
```

---

## 📡 API Endpoints

### **1. Generate Single Presigned URL**
```
POST /api/upload/presigned-url
```

**Request Body:**
```json
{
  "fileName": "image.jpg",
  "fileType": "image/jpeg",
  "fileSize": 1048576,
  "folder": "listings"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://...",
    "fileUrl": "https://campus-marketplace-team15.s3.us-east-1.amazonaws.com/listings/...",
    "key": "listings/1234567890-abcdef123456.jpg"
  }
}
```

### **2. Generate Batch Presigned URLs**
```
POST /api/upload/presigned-urls/batch
```

**Request Body:**
```json
{
  "files": [
    {
      "fileName": "image1.jpg",
      "fileType": "image/jpeg",
      "fileSize": 1048576
    },
    {
      "fileName": "image2.png",
      "fileType": "image/png",
      "fileSize": 2097152
    }
  ],
  "folder": "listings"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "uploadUrl": "https://...",
      "fileUrl": "https://campus-marketplace-team15.s3.us-east-1.amazonaws.com/listings/...",
      "key": "listings/1234567890-abcdef123456.jpg"
    },
    {
      "uploadUrl": "https://...",
      "fileUrl": "https://campus-marketplace-team15.s3.us-east-1.amazonaws.com/listings/...",
      "key": "listings/1234567891-fedcba654321.png"
    }
  ]
}
```

### **3. Delete File from S3**
```
DELETE /api/upload/*
```

**Note:** Uses Express 5.x wildcard syntax (`'*'` matches any path after `/api/upload/`)

**Example:**
```
DELETE /api/upload/listings/1234567890-abcdef123456.jpg
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

## 🎨 ImageUpload Component

### **Features:**
- ✅ Multiple file selection (up to 5 images)
- ✅ Drag-and-drop support
- ✅ Real-time image preview
- ✅ File type validation (JPEG, PNG, GIF, WebP)
- ✅ File size validation (max 5MB per image)
- ✅ Upload progress indicator
- ✅ Remove uploaded images
- ✅ Primary image indicator
- ✅ Error handling with user-friendly messages

### **Usage Example:**
```tsx
import ImageUpload from '../components/ImageUpload';

function MyComponent() {
  const [photos, setPhotos] = useState<Array<{ url: string; alt: string }>>([]);

  return (
    <ImageUpload
      maxImages={5}
      onImagesChange={setPhotos}
      existingImages={photos}
    />
  );
}
```

---

## ✨ Validation Rules

### **File Type:**
- ✅ `image/jpeg`
- ✅ `image/jpg`
- ✅ `image/png`
- ✅ `image/gif`
- ✅ `image/webp`

### **File Size:**
- Maximum: **5MB per image**

### **Image Count:**
- Maximum: **5 images per listing**

---

## 🚀 How to Test

### **1. Start the Backend:**
```bash
cd server
npm run dev
```

### **2. Start the Frontend:**
```bash
cd client
npm run dev
```

### **3. Test Upload Flow:**
1. Navigate to "Create New Listing"
2. Click "Upload Images"
3. Select 1-5 images (JPG, PNG, GIF, or WebP)
4. Wait for upload to complete
5. View image previews
6. Fill in other listing details
7. Submit the form
8. Check AWS S3 bucket for uploaded images

### **4. Verify in S3:**
1. Go to AWS S3 Console
2. Open `campus-marketplace-team15` bucket
3. Navigate to `listings/` folder
4. Verify images are uploaded

---

## 🔍 Code Structure

### **Backend Architecture:**
```
server/
├── utils/
│   └── s3.ts                    # S3 utility functions
├── handlers/
│   └── uploadHandler.ts         # Upload endpoint handlers
├── routes/
│   └── upload.ts                # Upload routes
├── middleware/
│   └── auth.ts                  # Authentication middleware (used)
└── .env                         # AWS credentials
```

### **Frontend Architecture:**
```
client/src/
├── components/
│   └── ImageUpload.tsx          # Reusable upload component
├── pages/
│   ├── CreateListing.tsx        # Create listing with upload
│   └── EditListing.tsx          # Edit listing with upload
└── services/
    └── api.ts                   # API service with upload methods
```

---

## 🛡️ Security Features

1. **Authentication Required** - All upload endpoints require valid JWT token
2. **File Type Validation** - Only allowed image types can be uploaded
3. **File Size Validation** - Prevents large file uploads
4. **Presigned URL Expiration** - URLs expire in 5 minutes
5. **CORS Configuration** - Only allowed origins can access S3
6. **IAM Permissions** - Least privilege access for S3 operations

---

## 📝 Future Enhancements

### **Possible improvements:**
1. ✨ Image compression before upload
2. ✨ Image cropping/editing tools
3. ✨ Drag-and-drop reordering of images
4. ✨ Automatic thumbnail generation
5. ✨ Image CDN integration
6. ✨ Profile picture upload support
7. ✨ Batch delete functionality
8. ✨ Upload progress percentage display
9. ✨ Image optimization (WebP conversion)
10. ✨ Lazy loading for image galleries

---

## 🐛 Troubleshooting

### **Issue: Upload fails with CORS error**
**Solution:** Verify CORS configuration in S3 bucket matches the documented settings.

### **Issue: Upload fails with 401 Unauthorized**
**Solution:** Ensure user is logged in and JWT token is valid.

### **Issue: Upload fails with 400 Bad Request**
**Solution:** Check file type and size meet validation requirements.

### **Issue: Images not displaying**
**Solution:** Verify S3 bucket permissions allow public read access or signed URLs.

### **Issue: AWS credentials not working**
**Solution:** Verify `.env` file exists and contains correct AWS credentials.

---

## 📊 Statistics

### **Total Files Created:** 5
### **Total Files Modified:** 5
### **Total Lines of Code Added:** ~800+
### **Technologies Used:** 
- AWS SDK v3
- TypeScript
- React
- Express.js
- Axios

---

## ✅ Completed Tasks Checklist

- [x] Install AWS SDK packages
- [x] Create S3 utility service
- [x] Create upload handler endpoints
- [x] Register upload routes in app
- [x] Configure AWS credentials
- [x] Update API service on client
- [x] Create ImageUpload component
- [x] Update CreateListing page
- [x] Update EditListing page
- [x] Test all functionality
- [x] Document implementation

---

## 👥 Contributors

**Implemented by:** Team 15  
**Branch:** S3  
**Date:** October 28, 2025  
**AWS Bucket:** campus-marketplace-team15

---

## 📞 Support

For issues or questions about this implementation, please:
1. Check this documentation
2. Review the code comments
3. Check AWS S3 Console for bucket status
4. Verify environment variables are set correctly
5. Check browser console for client-side errors
6. Check server logs for backend errors

---

**🎉 AWS S3 Integration Complete!**

