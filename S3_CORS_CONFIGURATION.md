# S3 CORS Configuration for Image Uploads 🔧

## Problem
When uploading images directly from the browser to S3, you may encounter CORS errors if S3 bucket is not properly configured.

## What is CORS?
**Cross-Origin Resource Sharing (CORS)** is a security feature that restricts web pages from making requests to a different domain than the one serving the web page.

When your frontend (http://localhost:3000) tries to upload to S3 (https://campus-marketplace-team15.s3.amazonaws.com), it's a **cross-origin request** and requires CORS configuration.

---

## Required S3 CORS Configuration

### Step 1: Go to AWS S3 Console
1. Open https://s3.console.aws.amazon.com/
2. Click on bucket: `campus-marketplace-team15`
3. Go to **Permissions** tab
4. Scroll down to **Cross-origin resource sharing (CORS)**
5. Click **Edit**

### Step 2: Add This CORS Configuration

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://127.0.0.1:3000",
            "https://your-production-domain.com"
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

### Step 3: Save Changes
Click **Save changes**

---

## What Each Setting Means

### AllowedHeaders
```json
"AllowedHeaders": ["*"]
```
- Allows all HTTP headers in requests
- Includes `Content-Type`, `Authorization`, etc.

### AllowedMethods
```json
"AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"]
```
- **PUT**: Required for uploading files with presigned URLs
- **GET**: Required for viewing/downloading images
- **DELETE**: Required for deleting images
- **HEAD**: Used to check if file exists

### AllowedOrigins
```json
"AllowedOrigins": [
    "http://localhost:3000",
    "https://your-production-domain.com"
]
```
- **Must include your frontend URL**
- Use exact URLs (including http:// or https://)
- Can use wildcard `"*"` for testing (NOT recommended for production)

### ExposeHeaders
```json
"ExposeHeaders": ["ETag", "x-amz-*"]
```
- Headers that browser can access from S3 response
- ETag is useful for verifying upload success

### MaxAgeSeconds
```json
"MaxAgeSeconds": 3000
```
- How long browser should cache CORS preflight response (50 minutes)

---

## Testing CORS Configuration

### Method 1: Browser Console Test
Open browser console on http://localhost:3000 and run:

```javascript
fetch('https://campus-marketplace-team15.s3.us-east-1.amazonaws.com/test.txt', {
  method: 'HEAD',
})
.then(response => console.log('✅ CORS working:', response.status))
.catch(error => console.error('❌ CORS error:', error));
```

### Method 2: Upload Test
1. Go to Create New Listing page
2. Try to upload an image
3. Open Browser DevTools → Network tab
4. Look for:
   - ✅ **OPTIONS** request (CORS preflight) → should return 200
   - ✅ **PUT** request (actual upload) → should return 200

---

## Common CORS Errors

### Error: "Access to XMLHttpRequest has been blocked by CORS policy"
**Problem:** S3 bucket doesn't allow your frontend origin

**Solution:**
1. Add your frontend URL to `AllowedOrigins` in CORS config
2. Make sure URL exactly matches (including protocol and port)

### Error: "Response to preflight request doesn't pass access control check"
**Problem:** S3 doesn't allow the HTTP method you're using

**Solution:**
1. Ensure `PUT` is in `AllowedMethods`
2. Check presigned URL is using PUT method

### Error: "Content-Type header is not allowed"
**Problem:** S3 doesn't allow Content-Type header

**Solution:**
1. Add `"Content-Type"` to `AllowedHeaders` or use `"*"`

---

## Temporary Testing Configuration

For **testing only**, you can use a permissive CORS config:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

**⚠️ WARNING:** Using `"*"` for `AllowedOrigins` in production is a **security risk**. Always use specific domains in production.

---

## S3 Bucket Permissions

In addition to CORS, ensure your S3 bucket has proper permissions:

### Bucket Policy (Optional)
For public read access to images:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::campus-marketplace-team15/listings/*"
        }
    ]
}
```

**Note:** Presigned URLs work WITHOUT public bucket policy (they include temporary credentials).

---

## Verification Checklist

After configuring CORS:

- [ ] CORS configuration saved in S3 bucket
- [ ] `AllowedOrigins` includes your frontend URL
- [ ] `AllowedMethods` includes `PUT` and `GET`
- [ ] `AllowedHeaders` includes `*` or `Content-Type`
- [ ] Backend server is running (port 8080)
- [ ] Frontend is running (port 3000)
- [ ] User is logged in (has JWT token)
- [ ] Try uploading an image

---

## Quick Fix Commands

### Test Presigned URL Generation
```bash
cd server
node -e "
require('dotenv').config();
const { generatePresignedUploadUrl } = require('./dist/utils/s3');
generatePresignedUploadUrl('test.jpg', 'image/jpeg', 'listings')
  .then(data => console.log('✅ URL generated:', data))
  .catch(err => console.error('❌ Error:', err));
"
```

### Check Environment Variables
```bash
cd server
node -e "
require('dotenv').config();
console.log('AWS_BUCKET_NAME:', process.env.AWS_BUCKET_NAME);
console.log('AWS_REGION:', process.env.AWS_REGION);
"
```

---

## Production Considerations

1. **Use specific origins** - Don't use `"*"` wildcard
2. **Limit headers** - Only allow necessary headers
3. **Use HTTPS** - Always use HTTPS in production
4. **Set proper bucket policy** - Control access levels
5. **Enable bucket encryption** - Encrypt data at rest
6. **Enable versioning** - Protect against accidental deletion
7. **Set lifecycle policies** - Automatically delete old files

---

## Status
After configuring CORS, uploads should work! 🎉

If still having issues, check:
1. Browser console for detailed error messages
2. Network tab for failed requests
3. Server logs for backend errors
