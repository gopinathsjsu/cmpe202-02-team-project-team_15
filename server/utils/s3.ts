import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

// Lazy S3 client initialization - only create when first needed
let s3ClientInstance: S3Client | null = null;
let s3ConfigLogged = false;

const getS3Client = (): S3Client => {
  if (!s3ClientInstance) {
    // Log configuration on first initialization
    if (!s3ConfigLogged) {
      console.log('\n=== S3 Client Initialization (First Use) ===');
      console.log('📋 Configuration Details:');
      console.log('   Region:', process.env.AWS_REGION || 'us-east-1');
      console.log('   Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? 
        `${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...` : '❌ NOT SET');
      console.log('   Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? 
        `${'*'.repeat(20)} (${process.env.AWS_SECRET_ACCESS_KEY.length} chars)` : '❌ NOT SET');
      console.log('   Bucket Name:', process.env.AWS_BUCKET_NAME || '❌ NOT SET');
      console.log('\n🔍 Validation:');
      console.log('   Has Region:', !!process.env.AWS_REGION, process.env.AWS_REGION ? '✅' : '⚠️ Using default');
      console.log('   Has Access Key:', !!process.env.AWS_ACCESS_KEY_ID, process.env.AWS_ACCESS_KEY_ID ? '✅' : '❌');
      console.log('   Has Secret Key:', !!process.env.AWS_SECRET_ACCESS_KEY, process.env.AWS_SECRET_ACCESS_KEY ? '✅' : '❌');
      console.log('   Has Bucket Name:', !!process.env.AWS_BUCKET_NAME, process.env.AWS_BUCKET_NAME ? '✅' : '❌');
      console.log('================================\n');
      s3ConfigLogged = true;
    }

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

    console.log('✅ S3Client initialized successfully with credentials from .env\n');
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

// Allowed image types
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
 * Generate presigned URL for direct client upload to S3
 */
export const generatePresignedUploadUrl = async (
  fileName: string,
  fileType: string,
  folder: 'listings' | 'profiles' = 'listings'
): Promise<{ uploadUrl: string; fileUrl: string; key: string }> => {
  const bucketName = getBucketName();
  const uniqueFileName = generateUniqueFileName(fileName);
  const key = `${folder}/${uniqueFileName}`;

  console.log('📤 Generating presigned URL:', {
    bucketName,
    key,
    fileType,
    folder
  });

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: fileType,
    // ServerSideEncryption: 'AES256', // Optional: Enable encryption
  });

  // Get S3 client and generate presigned URL valid for 5 minutes
  const client = getS3Client();
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });

  // Construct the public URL for the file
  const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  console.log('✅ Presigned URL generated successfully');

  return {
    uploadUrl, // URL for uploading
    fileUrl,   // URL for accessing the uploaded file
    key,       // S3 key for future reference
  };
};

/**
 * Delete a file from S3
 */
export const deleteFileFromS3 = async (key: string): Promise<void> => {
  const bucketName = getBucketName();
  const client = getS3Client();
  
  console.log('🗑️  Deleting file from S3:', { bucketName, key });
  
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await client.send(command);
  
  console.log('✅ File deleted successfully');
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

export default {
  generatePresignedUploadUrl,
  deleteFileFromS3,
  deleteMultipleFilesFromS3,
  validateFile,
  extractS3KeyFromUrl,
  generateUniqueFileName,
};


