# CORS Error - Troubleshooting Guide 🔧

## The Error You're Seeing
```
Access to XMLHttpRequest has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ What You've Done
- [x] Configured CORS in AWS S3
- [x] Added correct AllowedOrigins
- [x] Added correct AllowedMethods

## 🔍 Why It's Still Failing

### Reason 1: CORS Propagation Delay (Most Common)
AWS S3 CORS changes can take **2-5 minutes** to propagate globally.

**Solution:** Wait 5 minutes, then try again.

### Reason 2: Browser Cache
Your browser cached the CORS preflight response when it failed.

**Solution:** Hard refresh or clear cache (see below).

### Reason 3: CORS Config Not Saved Properly
Sometimes the AWS console doesn't save correctly.

**Solution:** Verify and re-save (see below).

---

## 🚀 Step-by-Step Fix

### Step 1: Verify CORS Configuration in AWS

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click bucket: **campus-marketplace-team15**
3. Go to **Permissions** tab
4. Scroll to **Cross-origin resource sharing (CORS)**
5. Verify it shows:

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
            "http://127.0.0.1:3000"
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

6. If anything is different, click **Edit** and re-save

### Step 2: Clear Browser Cache

**Chrome/Edge:**
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select **"Cached images and files"**
3. Click **"Clear data"**

**OR** Hard Refresh:
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### Step 3: Wait for Propagation
⏰ **Wait 5 minutes** for AWS to propagate CORS changes globally.

### Step 4: Test Upload Again

1. **Close and reopen your browser** (to clear any in-memory cache)
2. Go to http://localhost:3000
3. Make sure you're **logged in**
4. Go to "Create New Listing"
5. Open **DevTools** (F12) → **Console** tab
6. Try uploading an image
7. Check console for logs:
   ```
   📤 Starting upload for 1 files
   🔄 Uploading to S3: {...}
   ✅ S3 upload successful: 200
   ```

---

## 🧪 Test CORS Directly

Run this in your browser console (F12) to test CORS:

```javascript
// Test CORS configuration
fetch('https://campus-marketplace-team15.s3.us-east-1.amazonaws.com/', {
  method: 'HEAD',
  headers: {
    'Origin': 'http://localhost:3000'
  }
})
.then(response => {
  console.log('✅ CORS is working! Status:', response.status);
  console.log('✅ Access-Control-Allow-Origin:', response.headers.get('access-control-allow-origin'));
})
.catch(error => {
  console.error('❌ CORS still failing:', error);
  console.error('Wait 5 minutes and try again');
});
```

**Expected Result:**
```
✅ CORS is working! Status: 200
✅ Access-Control-Allow-Origin: http://localhost:3000
```

**If still failing:**
```
❌ CORS still failing: TypeError: Failed to fetch
→ Wait 5 more minutes for propagation
```

---

## 🔧 Alternative: Use Wildcard for Testing

**⚠️ FOR TESTING ONLY - NOT FOR PRODUCTION**

If you want to test quickly, temporarily use wildcard:

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

**After testing, change back to specific origins!**

---

## 🔍 Check S3 Bucket Block Public Access

Sometimes "Block Public Access" settings interfere with CORS:

1. In S3 bucket, go to **Permissions**
2. Look at **Block public access (bucket settings)**
3. For development, you can temporarily set:
   - ☑️ Block public access to buckets and objects granted through new access control lists (ACLs) - **OFF**
   - ☑️ Block public access to buckets and objects granted through any access control lists (ACLs) - **OFF**
   - ☑️ Block public access to buckets and objects granted through new public bucket or access point policies - **OFF**
   - ☑️ Block public and cross-account access to buckets and objects through any public bucket or access point policies - **OFF**

**Note:** Presigned URLs work even with block public access ON, but sometimes it can cause issues.

---

## 📊 Timeline of What Should Happen

```
Minute 0: CORS configured in AWS
    ↓
Minute 0-2: AWS propagating changes
    ↓
Minute 2-5: Changes fully propagated
    ↓
Minute 5+: Clear browser cache
    ↓
Minute 6: Test upload → Should work! ✅
```

---

## 🐛 Still Not Working After 10 Minutes?

### Check 1: Correct Bucket Name
Verify environment variable:
```bash
cd server
node -e "require('dotenv').config(); console.log('Bucket:', process.env.AWS_BUCKET_NAME)"
```
Should output: `Bucket: campus-marketplace-team15`

### Check 2: AWS Credentials
```bash
cd server
node -e "require('dotenv').config(); console.log('Region:', process.env.AWS_REGION, 'Has Keys:', !!process.env.AWS_ACCESS_KEY_ID)"
```
Should output: `Region: us-east-1 Has Keys: true`

### Check 3: Network Tab in DevTools
1. Open DevTools → **Network** tab
2. Try uploading
3. Look for requests:
   - **OPTIONS** request (preflight) - Status should be **200**
   - **PUT** request (actual upload) - Status should be **200**
4. Click the **OPTIONS** request
5. Check **Response Headers** - should include:
   ```
   access-control-allow-origin: http://localhost:3000
   access-control-allow-methods: PUT, GET, POST, DELETE, HEAD
   ```

---

## 💡 Quick Test Without CORS

To verify everything else works, test presigned URL generation:

```bash
cd server
node -e "
require('dotenv').config();
const { generatePresignedUploadUrl } = require('./dist/utils/s3');
generatePresignedUploadUrl('test.jpg', 'image/jpeg', 'listings')
  .then(data => {
    console.log('✅ Presigned URL generated:');
    console.log('Upload URL:', data.uploadUrl.substring(0, 100) + '...');
    console.log('File URL:', data.fileUrl);
  })
  .catch(err => console.error('❌ Error:', err.message));
"
```

This should generate a URL successfully.

---

## 🎯 Summary Checklist

- [ ] CORS config saved in AWS S3
- [ ] Waited at least 5 minutes for propagation
- [ ] Cleared browser cache
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Tested CORS with fetch in console
- [ ] Verified bucket name in .env
- [ ] Verified AWS credentials in .env
- [ ] Checked Network tab for OPTIONS/PUT requests
- [ ] No "Block Public Access" issues

---

## 🎉 When It Works

You'll see in console:
```
📤 Starting upload for 1 files
🔄 Uploading to S3: { url: "https://...", type: "image/jpeg", size: 245678 }
✅ S3 upload successful: 200
✅ Upload successful: [{ fileUrl: "...", key: "..." }]
```

And the image preview will appear in the UI! 🎊

