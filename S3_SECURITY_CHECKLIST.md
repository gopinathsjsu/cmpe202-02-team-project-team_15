# S3 Security Configuration Checklist

## ✅ Security Best Practices Implemented

### 1. Bucket Configuration
- **Bucket should be private**: Objects stored with `ACL: 'private'` (no public-read)
- **CloudFront for public access**: Use `S3_PUBLIC_BASE_URL` environment variable for CDN URLs
- **Block Public Access**: Ensure S3 bucket has "Block all public access" enabled in AWS Console

### 2. Presigned URL Security
- ✅ **Content-Type enforced**: Server sets Content-Type in presigned URL (client cannot override)
- ✅ **ACL set to private**: Objects stored with `ACL: 'private'` (no client-supplied ACLs)
- ✅ **Short TTL**: Presigned URLs expire in 60-300 seconds (default: 300s)
- ✅ **Key prefix restrictions**: Profile uploads limited to `profiles/{userId}/...` pattern

### 3. Key Generation Security
- **Profile uploads**: Keys must match `profiles/{userId}/avatar-{timestamp}.{ext}`
- **Server-side generation**: Keys are generated server-side, not client-supplied
- **Path validation**: Keys are validated to prevent path traversal attacks

### 4. Access Control
- **Authentication required**: All upload endpoints require JWT authentication
- **User-specific keys**: Profile uploads are scoped to authenticated user's ID
- **No public uploads**: All uploads require authentication

## 🔧 Configuration Steps

### AWS S3 Bucket Setup

1. **Create S3 Bucket** (if not exists)
   ```bash
   # Via AWS Console or CLI
   aws s3 mb s3://your-bucket-name --region us-east-1
   ```

2. **Block Public Access**
   - Go to S3 Console → Your Bucket → Permissions
   - Enable "Block all public access"
   - This ensures bucket is private by default

3. **Bucket Policy** (if needed for CloudFront)
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AllowCloudFrontAccess",
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity YOUR_OAI_ID"
         },
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

4. **CORS Configuration** (for direct uploads)
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["PUT", "POST"],
       "AllowedOrigins": [
         "http://localhost:3000",
         "https://your-production-domain.com"
       ],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

### CloudFront Setup (Optional but Recommended)

1. **Create CloudFront Distribution**
   - Origin: Your S3 bucket
   - Origin Access Control (OAC) or Origin Access Identity (OAI)
   - Enable HTTPS

2. **Set Environment Variable**
   ```env
   S3_PUBLIC_BASE_URL=https://your-cloudfront-domain.cloudfront.net
   ```

### Environment Variables

```env
# Required
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=your-bucket-name

# Optional (for CloudFront/CDN)
S3_PUBLIC_BASE_URL=https://your-cdn-domain.com
```

## 🔒 Security Features in Code

### Presigned URL Generation (`server/utils/s3.ts`)

```typescript
const command = new PutObjectCommand({
  Bucket: bucketName,
  Key: key,
  ContentType: fileType, // Enforced - client cannot override
  ACL: 'private',        // Explicitly private - no public-read
});
```

### Key Validation

- Profile uploads: `profiles/{userId}/avatar-{timestamp}.{ext}`
- Server-side generation prevents path traversal
- User ID validation ensures users can only upload to their own folder

### TTL Validation

```typescript
// Expiration time validated (60-300 seconds)
if (expiresIn < 60 || expiresIn > 300) {
  throw new Error('Expiration time must be between 60 and 300 seconds');
}
```

## ⚠️ Important Notes

1. **Bucket Policy**: The existing `S3_BUCKET_POLICY.json` allows public read access. For better security:
   - Remove public read access from bucket policy
   - Use CloudFront with Origin Access Control for public access
   - Or use presigned GET URLs for temporary public access

2. **Client-Supplied ACLs**: The presigned URL generation explicitly sets `ACL: 'private'`, preventing clients from overriding this.

3. **Content-Type Enforcement**: The Content-Type is set server-side in the presigned URL, preventing clients from uploading files with incorrect MIME types.

4. **Key Prefix Restrictions**: Profile uploads are restricted to `profiles/{userId}/...` pattern, preventing users from uploading to unauthorized locations.

## 🧪 Testing Security

1. **Test presigned URL expiration**: Wait 5+ minutes and verify URL no longer works
2. **Test key validation**: Try to upload with invalid key pattern (should fail)
3. **Test ACL enforcement**: Verify uploaded objects are private (not publicly accessible)
4. **Test Content-Type**: Try uploading with wrong Content-Type (should fail)

## 📚 References

- [AWS S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [Presigned URL Security](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [CloudFront with S3](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)

