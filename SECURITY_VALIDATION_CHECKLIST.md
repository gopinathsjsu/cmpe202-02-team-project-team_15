# Security & Validation Checklist

## ✅ Implemented Security Measures

### 1. File Type Whitelist ✅
**Status:** Implemented

**Server-side (`server/utils/s3.ts`):**
```typescript
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
```

**Client-side (`client/src/pages/Profile.tsx`):**
```typescript
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
```

**Security:** Only whitelisted image types are accepted. GIF removed from whitelist as per requirements.

---

### 2. File Size Limits ✅
**Status:** Implemented

**Server-side:**
- Max file size: **10MB** (within 5-10 MB range)
- Validated in `validateFile()` function

**Client-side:**
- Max file size: **10MB**
- Validated before upload to prevent unnecessary bandwidth usage

**Location:** `server/utils/s3.ts` and `client/src/pages/Profile.tsx`

---

### 3. Key Pattern Enforcement ✅
**Status:** Implemented

**Server-side validation:**
```typescript
// Profile uploads must match: profiles/{userId}/avatar-{timestamp}.{ext}
if (!key.startsWith(`profiles/${userId}/`)) {
  throw new Error('Invalid key pattern for profile upload');
}
```

**Location:** 
- `server/utils/s3.ts` - Key generation
- `server/handlers/profile.ts` - Key validation

**Security:** Users can only upload to their own profile directory.

---

### 4. S3 Object Validation (HEAD) ✅
**Status:** Implemented

**After upload validation:**
```typescript
// Verify object exists and is an image
const headResult = await headS3Object(key);

if (!headResult.exists) {
  return res.status(400).json({ message: 'S3 object missing' });
}

// Verify Content-Type is an image
const contentType = headResult.contentType || '';
if (!contentType.startsWith('image/')) {
  return res.status(400).json({ message: 'Uploaded file is not an image' });
}
```

**Location:** `server/handlers/profile.ts` - `updateProfilePhoto` handler

**Security:** Validates uploaded object exists and has correct Content-Type before saving to database.

---

### 5. Rate Limiting ✅
**Status:** Implemented

**Profile photo update rate limiting:**
- Minimum 1 minute between updates per user
- Prevents abuse and spam

**Location:** `server/middleware/profilePhotoRateLimit.ts`

**Usage:**
```typescript
router.put('/photo', authenticateToken, profilePhotoRateLimit, updateProfilePhoto);
```

**Future Enhancement:** Can be extended to track updates per hour/day using Redis or separate collection.

---

### 6. Filename Sanitization ✅
**Status:** Implemented

**Security measures:**
- Uses timestamped names: `avatar-{timestamp}.{ext}`
- Does NOT store user-provided filenames
- Sanitizes extension from filename
- Uses Content-Type to determine safe extension

**Implementation:**
```typescript
const generateProfileKey = (userId: string, fileName: string, contentType: string): string => {
  const timestamp = Date.now();
  const extension = sanitizeExtension(fileName, contentType);
  return `profiles/${userId}/avatar-${timestamp}.${extension}`;
};
```

**Location:** `server/utils/s3.ts`

**Security:** Prevents path traversal attacks and ensures safe file extensions.

---

### 7. Metadata Security ✅
**Status:** Implemented

**No private data in S3 metadata:**
```typescript
const command = new PutObjectCommand({
  Bucket: bucketName,
  Key: key,
  ContentType: fileType,
  ACL: 'private',
  // Metadata: {} // Intentionally empty - no user data in metadata
});
```

**Location:** `server/utils/s3.ts`

**Security:** No user-provided metadata is stored in S3 object metadata to prevent information leakage.

---

## Security Flow Summary

### Upload Flow with Security Checks:

1. **Client-side validation:**
   - ✅ File type whitelist check
   - ✅ File size validation (10MB max)

2. **Server-side presigned URL generation:**
   - ✅ File type validation
   - ✅ File size validation
   - ✅ Key pattern generation (profiles/{userId}/...)
   - ✅ Filename sanitization (timestamped, no user input)

3. **Client uploads to S3:**
   - ✅ Content-Type enforced in presigned URL
   - ✅ ACL set to private
   - ✅ No metadata stored

4. **Server validates upload:**
   - ✅ Rate limiting check (1 min minimum)
   - ✅ Key pattern validation
   - ✅ S3 HEAD request to verify object exists
   - ✅ Content-Type validation (must be image/*)

5. **Database update:**
   - ✅ Only after all validations pass
   - ✅ Updates user.photoUrl and user.photo_url

---

## Testing Checklist

### File Type Validation
- [ ] Test with valid types (JPEG, PNG, WebP) - should work
- [ ] Test with invalid types (GIF, PDF, EXE) - should reject
- [ ] Test with spoofed Content-Type - should reject

### File Size Validation
- [ ] Test with files < 10MB - should work
- [ ] Test with files > 10MB - should reject
- [ ] Test with exactly 10MB - should work

### Key Pattern Validation
- [ ] Test with valid key (profiles/{userId}/...) - should work
- [ ] Test with invalid key (profiles/other-user/...) - should reject
- [ ] Test with path traversal attempt - should reject

### S3 Validation
- [ ] Test with valid uploaded object - should work
- [ ] Test with missing object - should reject
- [ ] Test with non-image Content-Type - should reject

### Rate Limiting
- [ ] Test rapid updates (< 1 min apart) - should reject
- [ ] Test updates > 1 min apart - should work

### Filename Sanitization
- [ ] Test with malicious filename - should sanitize
- [ ] Test with path traversal in filename - should sanitize
- [ ] Test extension matches Content-Type - should validate

---

## Additional Security Recommendations

### Future Enhancements:

1. **Enhanced Rate Limiting:**
   - Track updates per hour/day in Redis
   - Implement sliding window rate limiting
   - Add IP-based rate limiting

2. **Image Processing:**
   - Strip EXIF metadata (remove GPS, camera info)
   - Validate image dimensions
   - Scan for malicious content

3. **Monitoring:**
   - Log all upload attempts
   - Alert on suspicious patterns
   - Track failed validation attempts

4. **Content Security:**
   - Implement virus scanning
   - Validate image integrity
   - Check for embedded scripts

---

## References

- [OWASP File Upload Security](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)
- [AWS S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [Content-Type Validation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)

