# S3 Upload Debugging - Presigned URL Generated But Upload Fails 🔍

## Problem
✅ Backend generates presigned URL correctly
❌ Browser cannot upload to S3 (CORS error)

## Why This Happens
The browser makes **two requests** to S3:
1. **OPTIONS** (preflight) - Asks "Can I upload from localhost:3000?"
2. **PUT** (actual upload) - Uploads the file

S3 is blocking the OPTIONS request, which prevents the PUT request.

---

## 🎯 Root Cause: Block Public Access

Even with CORS configured, **Block Public Access** settings prevent CORS headers from being sent.

### Current Status:
```
Browser → Presigned URL Request → Backend ✅ (Working)
Backend → Generate URL → Browser ✅ (Working)
Browser → OPTIONS Request → S3 ❌ (BLOCKED)
Browser → PUT Request → S3 ❌ (Never happens because OPTIONS failed)
```

---

## ✅ SOLUTION: Complete S3 Configuration

### Step 1: Turn OFF Block Public Access (CRITICAL!)

**This is the #1 cause of CORS failures with presigned URLs.**

1. Go to: https://s3.console.aws.amazon.com/
2. Open bucket: **campus-marketplace-team15**
3. Click **Permissions** tab
4. Find **Block public access (bucket settings)**
5. Click **Edit**
6. **UNCHECK ALL 4 OPTIONS:**

```
☐ Block public access to buckets and objects granted through new access control lists (ACLs)
☐ Block public access to buckets and objects granted through any access control lists (ACLs)
☐ Block public access to buckets and objects granted through new public bucket or access point policies
☐ Block public and cross-account access to buckets and objects through any public bucket or access point policies
```

7. Click **Save changes**
8. Type **`confirm`**
9. Click **Confirm**

### Step 2: Verify CORS (Should Already Be Set)

Permissions → CORS → Should be:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
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

**Important:** NO "OPTIONS" in AllowedMethods (S3 handles it automatically)

### Step 3: Verify Bucket Policy (Should Already Be Set)

Permissions → Bucket policy → Should be:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::campus-marketplace-team15/*"
        }
    ]
}
```

### Step 4: Wait and Clear Cache

1. **Wait 2-3 minutes** for AWS to propagate changes
2. **Clear browser cache:**
   - Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
   - Or open **Incognito/Private window**
3. **Close and reopen browser**

---

## 🧪 Test After Changes

### Test 1: CORS Preflight Test

Open browser console (F12) and run:

```javascript
fetch('https://campus-marketplace-team15.s3.us-east-1.amazonaws.com/', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:3000',
    'Access-Control-Request-Method': 'PUT',
    'Access-Control-Request-Headers': 'content-type'
  }
})
.then(response => {
  console.log('✅ OPTIONS Success! Status:', response.status);
  console.log('✅ CORS Headers:', {
    origin: response.headers.get('access-control-allow-origin'),
    methods: response.headers.get('access-control-allow-methods'),
    headers: response.headers.get('access-control-allow-headers')
  });
})
.catch(error => {
  console.error('❌ OPTIONS Failed:', error);
  console.log('Check: Block Public Access settings');
});
```

**Expected Result:**
```
✅ OPTIONS Success! Status: 200
✅ CORS Headers: {
  origin: "http://localhost:3000",
  methods: "GET, PUT, POST, DELETE, HEAD",
  headers: "*"
}
```

### Test 2: Upload Test

1. Go to http://localhost:3000
2. Login
3. Create New Listing
4. Upload an image
5. Check browser console:

**Should see:**
```
📤 Starting upload for 1 files
🔄 Uploading to S3: { url: "...", type: "image/jpeg", size: ... }
✅ S3 upload successful: 200
✅ Upload successful
```

**Should NOT see:**
```
❌ Access to XMLHttpRequest has been blocked by CORS policy
```

---

## 🔍 Network Tab Debugging

Open DevTools → **Network** tab → Try upload:

### What to Look For:

#### 1. OPTIONS Request (Preflight)
```
Request URL: https://campus-marketplace-team15.s3...
Request Method: OPTIONS
Status: 200 OK ✅

Response Headers:
  access-control-allow-origin: http://localhost:3000 ✅
  access-control-allow-methods: GET, PUT, POST, DELETE, HEAD ✅
  access-control-allow-headers: * ✅
```

**If OPTIONS fails:**
- Status: (failed) or (blocked:other)
- Missing CORS headers
- → **Block Public Access is still ON**

#### 2. PUT Request (Actual Upload)
```
Request URL: https://campus-marketplace-team15.s3...?X-Amz-Algorithm=...
Request Method: PUT
Status: 200 OK ✅

Request Headers:
  Content-Type: image/jpeg ✅
  Origin: http://localhost:3000 ✅
```

**If PUT fails:**
- net::ERR_FAILED
- → OPTIONS request failed first

---

## 🚨 Common Issues and Fixes

### Issue 1: "No 'Access-Control-Allow-Origin' header present"

**Cause:** Block Public Access is still ON

**Fix:**
1. Check Block Public Access settings
2. All 4 options must be UNCHECKED
3. Click Save and type "confirm"
4. Wait 2 minutes
5. Clear browser cache

### Issue 2: OPTIONS Request Returns 403

**Cause:** CORS not configured or Block Public Access ON

**Fix:**
1. Verify CORS configuration (no "OPTIONS" in methods)
2. Turn off Block Public Access
3. Wait 2 minutes

### Issue 3: PUT Request Returns 403

**Cause:** Presigned URL expired or invalid credentials

**Fix:**
1. Check server logs for presigned URL details
2. Verify AWS credentials in .env are correct
3. Presigned URLs expire in 5 minutes - try again

### Issue 4: Browser Cached Failed CORS Response

**Cause:** Browser cached the failed OPTIONS response

**Fix:**
1. Hard refresh: Ctrl + Shift + R
2. Or use Incognito mode
3. Or clear browser cache completely

---

## 📊 Configuration Checklist

Verify ALL of these in AWS S3 Console:

- [ ] **Block Public Access** → ALL 4 OPTIONS UNCHECKED
- [ ] **CORS** → Configured (no "OPTIONS" in methods)
- [ ] **Bucket Policy** → Allows public GetObject
- [ ] **IAM User** → Has PutObject, GetObject, DeleteObject permissions
- [ ] **Bucket exists** → campus-marketplace-team15
- [ ] **Region correct** → us-east-1

---

## 🎯 Quick Verification Script

Run this in browser console to check everything:

```javascript
console.log('=== S3 Upload Diagnostic ===\n');

// 1. Check authentication
const token = localStorage.getItem('accessToken');
console.log('1. ✅ Logged in:', !!token);

// 2. Test backend
fetch('http://localhost:8080/health')
  .then(r => r.json())
  .then(d => console.log('2. ✅ Backend running:', d.success))
  .catch(e => console.error('2. ❌ Backend error:', e));

// 3. Test S3 CORS (most important!)
fetch('https://campus-marketplace-team15.s3.us-east-1.amazonaws.com/', {
  method: 'HEAD',
  headers: { 'Origin': 'http://localhost:3000' }
})
.then(response => {
  console.log('3. ✅ S3 CORS working! Status:', response.status);
  console.log('   Access-Control-Allow-Origin:', 
    response.headers.get('access-control-allow-origin'));
})
.catch(error => {
  console.error('3. ❌ S3 CORS BLOCKED:', error.message);
  console.log('   → Turn OFF Block Public Access in S3!');
});

// 4. Test presigned URL generation
fetch('http://localhost:8080/api/upload/presigned-urls/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    files: [{
      fileName: 'test.jpg',
      fileType: 'image/jpeg',
      fileSize: 100000
    }],
    folder: 'listings'
  })
})
.then(r => r.json())
.then(data => {
  console.log('4. ✅ Presigned URL generated:', data.success);
  if (data.data && data.data[0]) {
    console.log('   URL:', data.data[0].uploadUrl.substring(0, 80) + '...');
  }
})
.catch(e => console.error('4. ❌ Presigned URL error:', e));

console.log('\n=== End Diagnostic ===');
```

---

## 🎯 Expected Results After Fix

### In Browser Console:
```
=== S3 Upload Diagnostic ===

1. ✅ Logged in: true
2. ✅ Backend running: true
3. ✅ S3 CORS working! Status: 200
   Access-Control-Allow-Origin: http://localhost:3000
4. ✅ Presigned URL generated: true
   URL: https://campus-marketplace-team15.s3.us-east-1.amazonaws.com/listings/...

=== End Diagnostic ===
```

### In Network Tab:
```
OPTIONS https://campus-marketplace-team15... → 200 OK ✅
PUT https://campus-marketplace-team15... → 200 OK ✅
```

### In Application:
```
📤 Starting upload
✅ Upload successful
[Image preview appears]
```

---

## 💡 Why Block Public Access Blocks CORS

Even though presigned URLs contain authentication, **Block Public Access** prevents S3 from sending CORS headers to the browser. This is by design - it's an extra security layer.

For presigned URL uploads to work with CORS:
- You need to allow cross-origin requests
- This requires turning off Block Public Access
- Your bucket policy and IAM policies still control who can do what
- Presigned URLs still require valid AWS credentials (just temporary)

---

## 🎉 Success Indicators

After turning off Block Public Access, you should see:

1. ✅ OPTIONS request succeeds (200 OK)
2. ✅ CORS headers present in OPTIONS response
3. ✅ PUT request succeeds (200 OK)
4. ✅ Image uploaded to S3
5. ✅ Image preview appears in UI
6. ✅ Can create listing with images

