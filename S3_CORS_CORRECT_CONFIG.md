# ✅ Correct AWS S3 CORS Configuration

## The Issue
AWS S3 gave error: "Found unsupported HTTP method in CORS config. Unsupported method is OPTIONS."

## Why This Happens
- AWS S3 **automatically handles OPTIONS** requests for CORS preflight
- You should **NOT** include "OPTIONS" in AllowedMethods
- S3 will return appropriate CORS headers for OPTIONS automatically

---

## ✅ CORRECT CORS Configuration

### Go to AWS S3 Console:
1. Open: https://s3.console.aws.amazon.com/
2. Click bucket: **campus-marketplace-team15**
3. Go to **Permissions** tab
4. Scroll to **Cross-origin resource sharing (CORS)**
5. Click **Edit**
6. Use this configuration:

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

7. Click **Save changes**

---

## Key Changes

### ❌ WRONG (with OPTIONS):
```json
"AllowedMethods": [
    "GET",
    "PUT",
    "POST",
    "DELETE",
    "HEAD",
    "OPTIONS"  ← REMOVE THIS!
]
```

### ✅ CORRECT (without OPTIONS):
```json
"AllowedMethods": [
    "GET",
    "PUT",
    "POST",
    "DELETE",
    "HEAD"
]
```

---

## How It Works

1. **Browser sends OPTIONS** (preflight request)
   - S3 automatically responds with CORS headers
   - No need to list OPTIONS in config

2. **Browser sends PUT** (actual upload)
   - S3 checks if PUT is in AllowedMethods ✅
   - Upload proceeds

---

## Verification

After saving, wait 2-3 minutes, then test in browser console:

```javascript
fetch('https://campus-marketplace-team15.s3.us-east-1.amazonaws.com/', {
  method: 'HEAD',
  headers: { 'Origin': 'http://localhost:3000' }
})
.then(r => console.log('✅ CORS Working! Status:', r.status))
.catch(e => console.error('❌ Failed:', e));
```

---

## Status
✅ Configuration corrected
✅ OPTIONS removed from AllowedMethods
✅ All necessary methods included (GET, PUT, POST, DELETE, HEAD)
✅ Localhost origins included

