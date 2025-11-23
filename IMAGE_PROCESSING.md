# Image Processing & Thumbnailing Strategy

## Current Implementation: Client-Side Resizing (Option A)

### ✅ Implemented: Client-Side Resizing

We use **client-side image resizing** before upload to reduce bandwidth and storage costs. This is the simplest and fastest approach for the current scope.

**Location:** `client/src/pages/Profile.tsx`

**Implementation:**
```typescript
const resizeImage = async (file: File, maxSize: number = 1024): Promise<File> => {
  const img = await createImageBitmap(file);
  const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
  const width = Math.round(img.width * ratio);
  const height = Math.round(img.height * ratio);
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
  
  const blob = await new Promise<Blob | null>(r => 
    canvas.toBlob(r, file.type, 0.85)
  );
  
  return new File([blob!], file.name, { type: file.type });
};
```

**Benefits:**
- ✅ Fast - no server processing required
- ✅ Simple - no additional infrastructure needed
- ✅ Reduces bandwidth - smaller files uploaded
- ✅ Reduces storage costs - only one file stored
- ✅ Immediate - no waiting for server processing

**Limitations:**
- ⚠️ Quality depends on client device capabilities
- ⚠️ No standardized sizes (users may upload different dimensions)
- ⚠️ No multiple thumbnail sizes (only one resized version)

**Current Settings:**
- Max size: 1024px (largest dimension)
- Quality: 0.85 (85% JPEG quality)
- Format: Preserves original format (JPEG, PNG, WebP)

## Future Enhancement: Server-Side Thumbnailing (Option B)

### Architecture Overview

For production-scale applications requiring standardized sizes and multiple thumbnail variants, implement server-side processing:

```
S3 Upload → S3 Event → SNS/SQS → Lambda/Worker → Generate Thumbnails → Upload to S3
```

### Implementation Steps

#### 1. S3 Event Configuration

Configure S3 bucket to trigger events on object creation:

```json
{
  "Rules": [
    {
      "Name": "ProfilePhotoThumbnail",
      "Status": "Enabled",
      "Filter": {
        "Key": {
          "FilterRules": [
            {
              "Name": "prefix",
              "Value": "profiles/"
            }
          ]
        }
      },
      "Destination": {
        "SnsTopic": {
          "Arn": "arn:aws:sns:region:account:profile-photo-processing"
        }
      }
    }
  ]
}
```

#### 2. Lambda Function / Worker

Create a worker that processes images:

**Dependencies:**
```json
{
  "sharp": "^0.32.0"
}
```

**Example Lambda Function:**
```typescript
import sharp from 'sharp';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.AWS_BUCKET_NAME!;

export const handler = async (event: any) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;
    
    // Only process profile photos
    if (!key.startsWith('profiles/') || !key.includes('/avatar-')) {
      continue;
    }
    
    // Download original image
    const getObject = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Client.send(getObject);
    const stream = response.Body as Readable;
    const buffer = await streamToBuffer(stream);
    
    // Generate thumbnails
    const sizes = [
      { size: 64, suffix: '64x64' },
      { size: 256, suffix: '256x256' },
      { size: 512, suffix: '512x512' }
    ];
    
    const thumbnailKeys: string[] = [];
    
    for (const { size, suffix } of sizes) {
      const thumbnail = await sharp(buffer)
        .resize(size, size, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 85 })
        .toBuffer();
      
      // Upload thumbnail
      const thumbnailKey = key.replace('/avatar-', `/avatar-${suffix}.`);
      const putObject = new PutObjectCommand({
        Bucket: BUCKET,
        Key: thumbnailKey,
        Body: thumbnail,
        ContentType: 'image/jpeg',
        ACL: 'private'
      });
      
      await s3Client.send(putObject);
      thumbnailKeys.push(thumbnailKey);
    }
    
    // Optionally: Update user document with thumbnail URLs
    // await updateUserThumbnails(userId, thumbnailKeys);
  }
};

function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
```

#### 3. Update User Model

Add thumbnail URLs to User model:

```typescript
// server/models/User.ts
photo_url?: string;
photo_thumbnails?: {
  '64x64': string;
  '256x256': string;
  '512x512': string;
};
```

#### 4. Update Profile Handler

Update profile photo handler to store thumbnail URLs:

```typescript
// After thumbnails are generated, update user document
await User.findByIdAndUpdate(userId, {
  photo_url: originalUrl,
  photo_thumbnails: {
    '64x64': thumbnail64Url,
    '256x256': thumbnail256Url,
    '512x512': thumbnail512Url
  }
});
```

### Benefits of Server-Side Processing

- ✅ **Standardized sizes**: All thumbnails are consistent dimensions
- ✅ **Multiple sizes**: Generate 64x64, 256x256, 512x512 variants
- ✅ **Better quality**: Server-side processing with Sharp library
- ✅ **Automatic**: No client-side code changes needed
- ✅ **Scalable**: Can process thousands of images

### Drawbacks

- ⚠️ **Infrastructure required**: S3 Events, SNS/SQS, Lambda/Worker
- ⚠️ **Cost**: Additional AWS services and compute time
- ⚠️ **Latency**: Thumbnails available after processing (async)
- ⚠️ **Complexity**: More moving parts to maintain

## Recommendation

**Current (MVP):** Use client-side resizing ✅
- Simple, fast, no infrastructure needed
- Good enough for most use cases
- Reduces bandwidth and storage

**Future (Production):** Add server-side thumbnailing when:
- Need standardized thumbnail sizes
- Need multiple size variants
- Have infrastructure budget
- Processing volume justifies the complexity

## Migration Path

1. **Phase 1 (Current):** Client-side resizing to 1024px
2. **Phase 2 (Future):** Add S3 event triggers
3. **Phase 3 (Future):** Deploy Lambda/Worker for thumbnailing
4. **Phase 4 (Future):** Update User model to store thumbnail URLs
5. **Phase 5 (Future):** Update frontend to use appropriate thumbnail sizes

## Testing

### Client-Side Resizing
```typescript
// Test in browser console
const file = /* file input */;
const resized = await resizeImage(file, 1024);
console.log('Original size:', file.size);
console.log('Resized size:', resized.size);
console.log('Reduction:', ((1 - resized.size / file.size) * 100).toFixed(2) + '%');
```

### Server-Side Thumbnailing
- Upload test image to S3
- Verify S3 event triggers
- Check Lambda logs for processing
- Verify thumbnails created in S3
- Verify user document updated

## References

- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [AWS S3 Event Notifications](https://docs.aws.amazon.com/AmazonS3/latest/userguide/NotificationHowTo.html)
- [AWS Lambda with S3](https://docs.aws.amazon.com/lambda/latest/dg/with-s3.html)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

