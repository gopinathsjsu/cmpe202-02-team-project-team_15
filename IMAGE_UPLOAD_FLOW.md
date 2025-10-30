# Image Upload Flow - Complete Documentation 📸

## Overview
The image upload system uses a **presigned URL approach** for secure, direct-to-S3 uploads.

---

## 🔄 Complete Upload Flow

### Step 1: User Selects Image (Frontend)
**File:** `client/src/components/ImageUpload.tsx`

```typescript
// User clicks "Upload Images" button
handleUploadClick() → fileInputRef.click()
  ↓
// User selects files
handleFileSelect(event) → Gets File[] from input
  ↓
// Validates files (type, size)
validateFile(file) → Checks if JPG/PNG/GIF/WebP, under 5MB
```

---

### Step 2: Request Presigned URLs (Frontend → Backend)
**File:** `client/src/services/api.ts`

```typescript
// ImageUpload.tsx line 76:
apiService.uploadMultipleImages(filesArray, 'listings')
  ↓
// api.ts line 287-298:
uploadMultipleImages(files, folder) {
  // Prepare file metadata
  const fileDetails = files.map(file => ({
    fileName: file.name,
    fileType: file.type,  // e.g., "image/jpeg"
    fileSize: file.size,  // in bytes
  }));
  
  // Request presigned URLs from backend
  ↓
  POST http://localhost:8080/api/upload/presigned-urls/batch
  Headers: {
    Authorization: "Bearer <JWT_TOKEN>",
    Content-Type: "application/json"
  }
  Body: {
    files: [
      { fileName: "photo.jpg", fileType: "image/jpeg", fileSize: 245678 },
      ...
    ],
    folder: "listings"
  }
}
```

---

### Step 3: Backend Validates & Generates URLs
**File:** `server/handlers/uploadHandler.ts`

```typescript
// Line 70-149:
getBatchPresignedUploadUrls(req, res) {
  ↓
  // 1. Check authentication
  const authUser = req.user;  // From JWT middleware
  if (!authUser) → return 401 Unauthorized
  
  ↓
  // 2. Validate request
  if (!files || files.length === 0) → return 400 Bad Request
  if (files.length > 5) → return 400 "Maximum 5 files"
  
  ↓
  // 3. Validate each file
  for each file:
    validateFile(fileType, fileSize)
    if invalid → return 400 with error
  
  ↓
  // 4. Generate presigned URLs
  Call generatePresignedUploadUrl() for each file
}
```

**File:** `server/utils/s3.ts`

```typescript
// Line 79-116:
generatePresignedUploadUrl(fileName, fileType, folder) {
  ↓
  // 1. Get bucket name (runtime validation)
  const bucketName = getBucketName()  // "campus-marketplace-team15"
  
  ↓
  // 2. Generate unique filename
  const uniqueFileName = generateUniqueFileName(fileName)
  // e.g., "1730165443000-abc123def456.jpg"
  
  ↓
  // 3. Create S3 key
  const key = `${folder}/${uniqueFileName}`
  // e.g., "listings/1730165443000-abc123def456.jpg"
  
  ↓
  // 4. Create AWS S3 PutObjectCommand
  const command = new PutObjectCommand({
    Bucket: "campus-marketplace-team15",
    Key: "listings/1730165443000-abc123def456.jpg",
    ContentType: "image/jpeg"
  });
  
  ↓
  // 5. Generate presigned URL (valid for 5 minutes)
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  
  ↓
  // 6. Construct public file URL
  const fileUrl = `https://campus-marketplace-team15.s3.us-east-1.amazonaws.com/listings/1730165443000-abc123def456.jpg`
  
  ↓
  return { uploadUrl, fileUrl, key }
}
```

**Backend Response:**
```json
{
  "success": true,
  "data": [
    {
      "uploadUrl": "https://campus-marketplace-team15.s3.amazonaws.com/listings/12345-abc.jpg?X-Amz-Algorithm=...",
      "fileUrl": "https://campus-marketplace-team15.s3.us-east-1.amazonaws.com/listings/12345-abc.jpg",
      "key": "listings/12345-abc.jpg"
    }
  ]
}
```

---

### Step 4: Upload Files to S3 (Frontend → S3)
**File:** `client/src/services/api.ts`

```typescript
// api.ts line 300-305:
uploadMultipleImages(files, folder) {
  ...
  // Got presigned URLs from backend
  const urlData = await getBatchPresignedUploadUrls(...)
  
  ↓
  // Upload all files directly to S3 in parallel
  const uploadPromises = files.map((file, index) =>
    this.uploadFileToS3(urlData[index].uploadUrl, file)
  );
  
  await Promise.all(uploadPromises);
  
  ↓
  // uploadFileToS3 (line 251-257):
  uploadFileToS3(presignedUrl, file) {
    // Direct PUT request to S3 (NOT to our backend!)
    await axios.put(presignedUrl, file, {
      headers: {
        'Content-Type': file.type,  // Must match!
      },
    });
  }
}
```

**What happens here:**
- Files are uploaded **directly to AWS S3**
- Does NOT go through your backend server
- Uses the presigned URL with temporary AWS credentials
- S3 validates the signature and accepts the upload

---

### Step 5: Update UI with Image URLs
**File:** `client/src/components/ImageUpload.tsx`

```typescript
// Line 76-90:
const uploadedData = await apiService.uploadMultipleImages(filesArray, 'listings');

// uploadedData = [
//   { fileUrl: "https://...", key: "listings/12345-abc.jpg" },
//   ...
// ]

// Create image objects for UI
const newImages = uploadedData.map((data, index) => ({
  url: data.fileUrl,        // S3 URL to display image
  alt: filesArray[index].name,
  key: data.key,            // For future deletion
  preview: URL.createObjectURL(filesArray[index])  // Local preview
}));

// Update state
setImages([...images, ...newImages]);

// Notify parent (CreateListing component)
onImagesChange(updatedImages.map(({ url, alt }) => ({ url, alt })));
```

---

### Step 6: Create Listing with Image URLs
**File:** `client/src/pages/CreateListing.tsx`

```typescript
// Line 34-63:
handleCreateListing(e) {
  ...
  const listingData = {
    title: itemName,
    description: description,
    price: parseFloat(price),
    categoryId: selectedCategory._id,
    photos: photos  // Array of { url, alt }
  };
  
  ↓
  // Send to backend
  POST http://localhost:8080/api/listings
  Body: {
    title: "iPhone 13",
    description: "Like new",
    price: 800,
    categoryId: "abc123",
    photos: [
      {
        url: "https://campus-marketplace-team15.s3.us-east-1.amazonaws.com/listings/12345-abc.jpg",
        alt: "photo.jpg"
      }
    ]
  }
}
```

---

## 🔐 Security & Authentication

### JWT Token Flow
```
1. User logs in → Backend generates JWT token
2. Token stored in localStorage
3. Every API request includes: Authorization: "Bearer <token>"
4. Backend middleware validates token
5. If valid → req.user contains user data
6. If invalid/expired → 401 error
```

### Presigned URL Security
```
1. URLs are temporary (5 minutes)
2. URLs are signed with AWS credentials
3. URLs include specific permissions (PUT only)
4. URLs are tied to specific bucket/key
5. Cannot be reused for different files
```

---

## 🔍 Common Errors & Solutions

### Error: "Failed to upload images"
**Possible Causes:**
1. **Not authenticated** - No JWT token or expired token
2. **Invalid file type** - Not JPG/PNG/GIF/WebP
3. **File too large** - Over 5MB
4. **Bucket name not set** - AWS_BUCKET_NAME missing
5. **AWS credentials invalid** - Wrong access keys
6. **S3 upload failed** - Network issue or CORS problem

### Error: "Authentication required"
**Solution:**
- User must be logged in
- Check localStorage for 'accessToken'
- Token must not be expired

### Error: "Empty value provided for input HTTP label: Bucket"
**Solution:**
- Check .env file has AWS_BUCKET_NAME
- Verify dotenv.config() called before imports
- Check bucket name is loaded at runtime

---

## 📋 Environment Variables Required

```bash
# Server .env
AWS_REGION=us-east-1
AWS_BUCKET_NAME=campus-marketplace-team15
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=GT7K0...
```

---

## 🎯 Data Flow Diagram

```
┌─────────────┐
│   Browser   │
│   (Client)  │
└──────┬──────┘
       │ 1. Select files
       │
       ├─────────────────────────────────┐
       │                                 │
       │ 2. POST /api/upload/           │
       │    presigned-urls/batch        │
       │    + JWT Token                 │
       ↓                                 │
┌─────────────┐                         │
│   Backend   │                         │
│   Server    │                         │
└──────┬──────┘                         │
       │ 3. Validate auth & files       │
       │                                 │
       │ 4. Generate presigned URLs     │
       │    (AWS SDK)                   │
       ↓                                 │
┌─────────────┐                         │
│   AWS S3    │                         │
│   Service   │←────────────────────────┘
└──────┬──────┘  5. Direct upload
       │         using presigned URL
       │
       │ 6. File stored in S3
       │    at: s3://bucket/listings/12345.jpg
       │
       └────────> Returns public URL
```

---

## ✅ Verification Checklist

- [ ] User is logged in (has JWT token)
- [ ] File is valid type (JPG/PNG/GIF/WebP)
- [ ] File is under 5MB
- [ ] AWS_BUCKET_NAME is set in .env
- [ ] AWS credentials are valid
- [ ] Backend server is running on port 8080
- [ ] S3 bucket exists and has correct permissions
- [ ] CORS is configured on S3 bucket (for direct uploads)

