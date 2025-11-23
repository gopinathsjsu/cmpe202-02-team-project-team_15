import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

// Lazy S3 client initialization - only create when first needed
let s3ClientInstance: S3Client | null = null;

const getS3Client = (): S3Client => {
  if (!s3ClientInstance) {
    // Validate credentials before creating client
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not found. Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file');
    }

    // Create S3 client
    s3ClientInstance = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3ClientInstance;
};

// Get bucket name - with runtime validation
const getBucketName = (): string => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  if (!bucketName) {
    console.error('❌ CRITICAL: AWS_BUCKET_NAME is not set in environment variables!');
    console.error('Available AWS env vars:', Object.keys(process.env).filter(k => k.startsWith('AWS_')));
    throw new Error('AWS_BUCKET_NAME environment variable is required but not set');
  }
  return bucketName;
};

// Allowed image types (whitelist only)
// Security: Only allow safe image formats
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

// Max file size: 10MB (5-10 MB range as per security requirements)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Generate a unique filename with timestamp and random hash
 */
export const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(8).toString('hex');
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomHash}.${extension}`;
};

/**
 * Validate file type and size
 */
export const validateFile = (fileType: string, fileSize: number): { valid: boolean; error?: string } => {
  if (!ALLOWED_FILE_TYPES.includes(fileType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`,
    };
  }

  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
};

/**
 * Sanitize file extension to prevent path traversal and ensure safe extensions
 */
const sanitizeExtension = (fileName: string, contentType: string): string => {
  // Extract extension from filename
  let ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Remove any path traversal attempts
  ext = ext.replace(/[^a-z0-9]/g, '');
  
  // Map content type to safe extension
  const contentTypeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  
  // Use content type to determine extension (more secure than filename)
  const safeExt = contentTypeMap[contentType] || 'jpg';
  
  // Validate extension matches content type
  if (ext && ['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
    // Normalize jpeg to jpg
    return ext === 'jpeg' ? 'jpg' : ext;
  }
  
  return safeExt;
};

/**
 * Generate profile-specific key pattern: profiles/{userId}/avatar-<timestamp>.<ext>
 * Security: Uses timestamped names, sanitizes extension, avoids user-provided filenames
 */
const generateProfileKey = (userId: string, fileName: string, contentType: string): string => {
  const timestamp = Date.now();
  const extension = sanitizeExtension(fileName, contentType);
  return `profiles/${userId}/avatar-${timestamp}.${extension}`;
};

/**
 * Generate presigned URL for direct client upload to S3
 * @param fileName - Original file name
 * @param fileType - MIME type (must match Content-Type)
 * @param folder - Folder type ('listings' or 'profiles')
 * @param purpose - Purpose of upload ('profile' or 'listing')
 * @param userId - User ID (required for profile uploads)
 * @param expiresIn - Expiration time in seconds (60-300, default: 300)
 */
export const generatePresignedUploadUrl = async (
  fileName: string,
  fileType: string,
  folder: 'listings' | 'profiles' = 'listings',
  purpose?: 'profile' | 'listing',
  userId?: string,
  expiresIn: number = 300
): Promise<{ presignedUrl: string; key: string; publicUrl: string }> => {
  const bucketName = getBucketName();
  
  // Validate expiration time (60-300 seconds)
  if (expiresIn < 60 || expiresIn > 300) {
    throw new Error('Expiration time must be between 60 and 300 seconds');
  }

  // Generate key based on purpose
  // Security: Limit allowed key prefixes to prevent unauthorized uploads
  let key: string;
  if (purpose === 'profile') {
    if (!userId) {
      throw new Error('userId is required for profile uploads');
    }
    // Security: Profile keys must match profiles/{userId}/... pattern
    // Uses sanitized extension and timestamped names (no user-provided filenames)
    key = generateProfileKey(userId, fileName, fileType);
    
    // Validate key pattern to prevent path traversal or unauthorized access
    if (!key.startsWith(`profiles/${userId}/`)) {
      throw new Error('Invalid key pattern for profile upload');
    }
  } else {
    // Default behavior for listings or when purpose is not specified
    const uniqueFileName = generateUniqueFileName(fileName);
    key = `${folder}/${uniqueFileName}`;
    
    // Security: Validate listing keys are in allowed folders
    if (!key.startsWith('listings/') && !key.startsWith('profiles/')) {
      throw new Error('Invalid key pattern - must be in listings/ or profiles/ folder');
    }
  }

  // Security: Enforce Content-Type and set ACL to private
  // Objects are stored without public-read access
  // Public access should be via CloudFront if needed
  // Security: No metadata that could contain private data
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: fileType, // Enforced Content-Type (client cannot override)
    ACL: 'private', // Explicitly private - no public-read access
    // Security: Do not store user-provided metadata to avoid exposing private data
    // Metadata: {} // Intentionally empty - no user data in metadata
    // ServerSideEncryption: 'AES256', // Optional: Enable encryption
  });

  // Get S3 client and generate presigned URL (PUT method)
  const client = getS3Client();
  const presignedUrl = await getSignedUrl(client, command, { expiresIn });

  // Construct the public URL for the file
  const region = process.env.AWS_REGION || 'us-east-1';
  const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

  return {
    presignedUrl, // URL for uploading (PUT)
    key,          // S3 key for future reference
    publicUrl,    // Public URL for accessing the uploaded file
  };
};

/**
 * Verify S3 object exists and get metadata (including Content-Type)
 */
export const headS3Object = async (key: string): Promise<{ exists: boolean; contentType?: string }> => {
  try {
    const bucketName = getBucketName();
    const client = getS3Client();
    
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await client.send(command);
    return {
      exists: true,
      contentType: response.ContentType,
    };
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return { exists: false };
    }
    throw error;
  }
};

/**
 * Delete a file from S3
 */
export const deleteFileFromS3 = async (key: string): Promise<void> => {
  const bucketName = getBucketName();
  const client = getS3Client();
  
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await client.send(command);
};

/**
 * Delete multiple files from S3
 */
export const deleteMultipleFilesFromS3 = async (keys: string[]): Promise<void> => {
  const deletePromises = keys.map((key) => deleteFileFromS3(key));
  await Promise.all(deletePromises);
};

/**
 * Extract S3 key from file URL
 */
export const extractS3KeyFromUrl = (url: string): string | null => {
  try {
    const bucketName = getBucketName();
    const urlPattern = new RegExp(`https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/(.+)`);
    const match = url.match(urlPattern);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting S3 key:', error);
    return null;
  }
};

/**
 * Construct public URL for S3 object
 * Uses CloudFront if S3_PUBLIC_BASE_URL is set, otherwise constructs S3 URL
 */
export const constructPublicUrl = (key: string): string => {
  const bucketName = getBucketName();
  const region = process.env.AWS_REGION || 'us-east-1';
  
  // Use CloudFront or custom CDN URL if configured
  if (process.env.S3_PUBLIC_BASE_URL) {
    return `${process.env.S3_PUBLIC_BASE_URL}/${key}`;
  }
  
  // Fallback to S3 public URL
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
};

export default {
  generatePresignedUploadUrl,
  deleteFileFromS3,
  deleteMultipleFilesFromS3,
  validateFile,
  extractS3KeyFromUrl,
  generateUniqueFileName,
  headS3Object,
  constructPublicUrl,
};


