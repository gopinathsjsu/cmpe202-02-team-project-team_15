# AWS S3 Bucket Policy Setup Guide 🔒

## What is a Bucket Policy?
A bucket policy defines who can access your S3 bucket and what actions they can perform.

---

## 📋 Recommended Bucket Policy

Copy this policy to your S3 bucket:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": [
                "arn:aws:s3:::campus-marketplace-team15/listings/*",
                "arn:aws:s3:::campus-marketplace-team15/profiles/*"
            ]
        }
    ]
}
```

### What This Policy Does:
✅ **Allows public read access** to all images in `listings/` and `profiles/` folders
✅ **Anyone can view** the images (needed for displaying in UI)
✅ **Upload/delete still requires authentication** (via presigned URLs with your AWS credentials)
❌ **No one can upload or delete** without proper credentials

---

## 🛠️ How to Apply This Policy

### Step 1: Go to AWS S3 Console
1. Open: https://s3.console.aws.amazon.com/
2. Click on bucket: **campus-marketplace-team15**

### Step 2: Navigate to Bucket Policy
1. Click the **Permissions** tab
2. Scroll down to **Bucket policy**
3. Click **Edit**

### Step 3: Paste the Policy
1. Copy the JSON policy above
2. Paste it into the editor
3. Click **Save changes**

### Step 4: Update Block Public Access Settings
For the policy to work, you need to allow public access:

1. In the same **Permissions** tab
2. Go to **Block public access (bucket settings)**
3. Click **Edit**
4. **Uncheck** these two options:
   - ☐ Block public access to buckets and objects granted through **new** public bucket or access point policies
   - ☐ Block public and cross-account access to buckets and objects through **any** public bucket or access point policies
5. Keep these **CHECKED** (for security):
   - ☑ Block public access to buckets and objects granted through new access control lists (ACLs)
   - ☑ Block public access to buckets and objects granted through any access control lists (ACLs)
6. Click **Save changes**
7. Type `confirm` when prompted

---

## 🔐 Security Explained

### What's Public:
- ✅ **Reading/viewing images** - Anyone with the URL can view uploaded images
- This is necessary so your frontend can display images to all users

### What's Private:
- 🔒 **Uploading images** - Requires presigned URL with your AWS credentials
- 🔒 **Deleting images** - Requires presigned URL with your AWS credentials
- 🔒 **Listing bucket contents** - Not allowed
- 🔒 **Modifying images** - Not allowed

### Why This is Safe:
1. **Presigned URLs are temporary** (5 minutes)
2. **Presigned URLs are signed** with your AWS secret key
3. **Only authenticated users** can get presigned URLs (JWT token required)
4. **Images are read-only** for the public
5. **Upload/delete requires backend authentication**

---

## 🧪 Test the Policy

After applying the policy, test it:

### Test 1: Public Read Access
Try to access an image directly in browser:
```
https://campus-marketplace-team15.s3.us-east-1.amazonaws.com/listings/your-image.jpg
```
✅ Should display the image

### Test 2: Upload Requires Auth
Try to upload without presigned URL:
```bash
curl -X PUT https://campus-marketplace-team15.s3.us-east-1.amazonaws.com/listings/test.jpg \
     -H "Content-Type: image/jpeg" \
     --data-binary @test.jpg
```
❌ Should get "Access Denied" error (correct!)

### Test 3: Upload with Presigned URL
Upload through your application:
1. Go to Create New Listing
2. Upload an image
✅ Should work (presigned URL has temporary credentials)

---

## 🔄 Alternative: No Bucket Policy (More Restrictive)

If you want **more privacy** (images only accessible via presigned URLs):

**Don't add any bucket policy.**

### With No Policy:
- Images are **private by default**
- Can only be accessed via **presigned URLs** (even for viewing)
- More secure, but requires generating presigned URLs for viewing too

### To Use This Approach:
You'll need to modify your code to generate presigned URLs for **viewing** (GET) as well as uploading (PUT).

---

## 📊 Policy Comparison

| Feature | With Public Read Policy | Without Policy (Private) |
|---------|------------------------|--------------------------|
| View images | ✅ Anyone with URL | 🔒 Only via presigned URL |
| Upload images | 🔒 Auth required | 🔒 Auth required |
| Delete images | 🔒 Auth required | 🔒 Auth required |
| Setup complexity | Simple | Complex (need GET presigned URLs) |
| **Recommended for** | **Public marketplace** | Private/sensitive content |

---

## ⚠️ Important Notes

### 1. Resource ARN Format
Make sure the ARN matches your bucket name:
```
arn:aws:s3:::YOUR-BUCKET-NAME/folder/*
```

### 2. Folder Structure
The policy allows public read for:
- `listings/*` - Product listing images
- `profiles/*` - User profile images

If you add more folders, add them to the Resource array:
```json
"Resource": [
    "arn:aws:s3:::campus-marketplace-team15/listings/*",
    "arn:aws:s3:::campus-marketplace-team15/profiles/*",
    "arn:aws:s3:::campus-marketplace-team15/categories/*"
]
```

### 3. Policy Takes Effect Immediately
Unlike CORS (which takes 2-5 minutes), bucket policy changes are **instant**.

---

## 🚨 Common Errors

### Error: "Policy has invalid resource"
**Problem:** Wrong bucket name in ARN

**Solution:** Make sure ARN is:
```
arn:aws:s3:::campus-marketplace-team15/listings/*
```
(Use your actual bucket name)

### Error: "Access Denied" when viewing images
**Problem:** Block Public Access settings are too restrictive

**Solution:** Follow Step 4 above to adjust Block Public Access settings

### Error: Policy saved but images still not accessible
**Problem:** Wrong resource path or Block Public Access still on

**Solution:**
1. Check ARN is correct
2. Verify Block Public Access settings
3. Wait 1 minute and try again

---

## ✅ Verification Checklist

After setting up the policy:

- [ ] Bucket policy saved successfully
- [ ] Block Public Access adjusted (step 4)
- [ ] Can view uploaded images via direct URL
- [ ] Can upload images through application
- [ ] Cannot upload without authentication
- [ ] Images display in your application

---

## 🎯 Quick Setup Summary

1. **Copy the JSON policy** from above
2. **Go to S3 Console** → Your bucket → Permissions → Bucket policy
3. **Paste and save**
4. **Adjust Block Public Access** settings (uncheck 2 options)
5. **Test** by uploading an image and viewing it

---

## 📝 For Your .env File

No changes needed in `.env` - the policy works with your existing credentials:

```bash
AWS_BUCKET_NAME=campus-marketplace-team15
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
```

Your IAM user credentials already have permission to upload/delete. The bucket policy only affects public read access.

---

## 🎉 Result

After applying this policy:
- ✅ Users can view product images
- ✅ Only authenticated users can upload
- ✅ Images accessible via direct URL
- ✅ Secure and follows AWS best practices

