# Profile Photo Upload - Test Cases & QA

## Manual Test Cases

### 1. Upload Valid JPG (Small/Large) ✅

**Test Case:** Upload valid JPG image and verify it appears in profile and across app

**Steps:**
1. Navigate to Profile page
2. Click on avatar to open file picker
3. Select a valid JPG image (< 10MB)
4. Wait for upload to complete
5. Verify photo appears in:
   - Profile page avatar
   - Navbar avatar
   - Messages conversation avatars (if applicable)

**Expected Results:**
- ✅ Upload succeeds
- ✅ Photo appears immediately in profile
- ✅ Photo appears in Navbar
- ✅ Photo appears across all components using user.photoUrl
- ✅ Success message displayed
- ✅ No errors in console

**Test Files:**
- Small: `test-images/small-avatar.jpg` (50KB)
- Large: `test-images/large-avatar.jpg` (5MB)

---

### 2. Upload Invalid File Type ❌

**Test Case:** Attempt to upload invalid file type (GIF, PDF, EXE, etc.)

**Steps:**
1. Navigate to Profile page
2. Click on avatar
3. Select invalid file type (e.g., `test.pdf`, `test.gif`, `test.exe`)

**Expected Results:**
- ✅ Client-side validation blocks upload immediately
- ✅ Error message: "Invalid file type. Please upload JPG, PNG, or WebP images only."
- ✅ No network request sent
- ✅ Server-side also validates (if bypassed)

**Test Files:**
- `test-images/invalid.pdf`
- `test-images/invalid.gif`
- `test-images/invalid.exe`

---

### 3. Upload > Size Limit ❌

**Test Case:** Attempt to upload file exceeding 10MB limit

**Steps:**
1. Navigate to Profile page
2. Click on avatar
3. Select file > 10MB

**Expected Results:**
- ✅ Client-side validation blocks upload
- ✅ Error message: "File size exceeds 10MB limit"
- ✅ No network request sent
- ✅ Server-side also validates (if bypassed)

**Test File:**
- `test-images/oversized.jpg` (15MB)

---

### 4. Simulate Interrupted Upload (PUT Fails) ❌

**Test Case:** Simulate S3 upload failure and verify backend doesn't update DB

**Steps:**
1. Navigate to Profile page
2. Click on avatar
3. Select valid image
4. Interrupt upload (disconnect network, close browser, etc.)
5. Or use browser DevTools to block S3 PUT request

**Expected Results:**
- ✅ Upload fails with error message
- ✅ Database NOT updated (user.photoUrl remains unchanged)
- ✅ Error message displayed: "Upload to S3 failed"
- ✅ User can retry upload
- ✅ No partial state in database

**Verification:**
- Check database: `db.users.findOne({email: "test@example.com"})`
- Verify `photoUrl` field unchanged
- Check server logs for error

---

### 5. Try to Set Key Belonging to Another User ❌

**Test Case:** Attempt to use another user's S3 key

**Steps:**
1. Login as User A
2. Get User A's profile photo key: `profiles/{userIdA}/avatar-123.jpg`
3. Login as User B
4. Attempt to update profile with User A's key
5. Send PUT request: `PUT /api/profile/photo { key: "profiles/{userIdA}/avatar-123.jpg" }`

**Expected Results:**
- ✅ Server rejects request
- ✅ Status: 403 Forbidden
- ✅ Error message: "Invalid key for user. Key must start with profiles/{userId}/"
- ✅ Database NOT updated
- ✅ User B's photo remains unchanged

**Test Script:**
```bash
# As User B, try to use User A's key
curl -X PUT http://localhost:5000/api/profile/photo \
  -H "Authorization: Bearer {userB_token}" \
  -H "Content-Type: application/json" \
  -d '{"key": "profiles/{userIdA}/avatar-123.jpg"}'
```

---

## Automated Tests

### Unit Tests

#### Test: Presigned URL Endpoint

**File:** `server/__tests__/uploadHandler.test.ts`

**Test Cases:**
1. ✅ Returns presigned URL with correct format
2. ✅ Key pattern matches `profiles/{userId}/avatar-{timestamp}.{ext}`
3. ✅ Rejects invalid file types
4. ✅ Rejects files > 10MB
5. ✅ Requires authentication
6. ✅ Validates purpose parameter

---

#### Integration Tests

#### Test: Profile Photo Update

**File:** `server/__tests__/profile.test.ts`

**Test Cases:**
1. ✅ Updates user.photoUrl in database
2. ✅ Validates S3 object exists (mocked headObject)
3. ✅ Validates Content-Type is image/*
4. ✅ Rejects invalid key patterns
5. ✅ Rejects keys belonging to other users
6. ✅ Rate limiting works (1 min minimum)

---

## UX Test Cases

### 1. Progress Indicator ✅

**Test Case:** Show upload progress during upload

**Steps:**
1. Navigate to Profile page
2. Click on avatar
3. Select large image (5MB)
4. Observe upload progress

**Expected Results:**
- ✅ Loading spinner visible during upload
- ✅ Progress indicator shows upload status
- ✅ Avatar button disabled during upload
- ✅ Clear visual feedback

---

### 2. Preview Before Upload ✅

**Test Case:** Show image preview before upload completes

**Steps:**
1. Navigate to Profile page
2. Click on avatar
3. Select image
4. Observe preview

**Expected Results:**
- ✅ Preview appears immediately after file selection
- ✅ Preview shows selected image
- ✅ Preview updates when new image selected
- ✅ Preview clears after successful upload

---

### 3. Cancel Upload ✅

**Test Case:** Ability to cancel upload in progress

**Steps:**
1. Navigate to Profile page
2. Click on avatar
3. Select large image
4. Click cancel button during upload

**Expected Results:**
- ✅ Cancel button visible during upload
- ✅ Upload can be cancelled
- ✅ No database update if cancelled
- ✅ UI returns to normal state
- ✅ Can start new upload

---

### 4. Retry Failed Upload ✅

**Test Case:** Ability to retry after failed upload

**Steps:**
1. Navigate to Profile page
2. Click on avatar
3. Select image
4. Simulate upload failure (network error)
5. Click retry button

**Expected Results:**
- ✅ Error message displayed
- ✅ Retry button visible
- ✅ Can retry upload
- ✅ Previous file still available for retry
- ✅ No duplicate uploads

---

## Test Data

### Test Images

Create test images in `test-images/` directory:

```
test-images/
├── small-avatar.jpg      (50KB, 500x500)
├── large-avatar.jpg     (5MB, 2000x2000)
├── oversized.jpg        (15MB, 4000x4000)
├── valid-png.png        (100KB, 800x800)
├── valid-webp.webp      (80KB, 800x800)
├── invalid.pdf          (PDF file)
└── invalid.gif          (GIF file - should be rejected)
```

---

## Running Tests

### Manual Tests

1. Start development servers:
   ```bash
   npm run dev
   ```

2. Navigate to Profile page: `http://localhost:3000/profile`

3. Follow test cases above

### Automated Tests

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run all tests
npm run test:all
```

---

## Test Checklist

### Security Tests
- [ ] File type validation (client & server)
- [ ] File size validation (client & server)
- [ ] Key pattern enforcement
- [ ] User authorization (own keys only)
- [ ] Rate limiting
- [ ] S3 object validation

### Functional Tests
- [ ] Valid upload succeeds
- [ ] Photo appears across app
- [ ] Invalid uploads rejected
- [ ] Database updates correctly
- [ ] Error handling works

### UX Tests
- [ ] Progress indicator visible
- [ ] Preview shows correctly
- [ ] Cancel works
- [ ] Retry works
- [ ] Error messages clear
- [ ] Success feedback

---

## Bug Reports

When reporting bugs, include:
1. Test case number
2. Steps to reproduce
3. Expected vs actual behavior
4. Browser/OS information
5. Console errors
6. Network request/response details

