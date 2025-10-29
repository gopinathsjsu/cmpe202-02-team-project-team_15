import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';

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
  const uniqueFileName = generateUniqueFileName(fileName);
  const key = `${folder}/${uniqueFileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
    // Optional: Set ACL to public-read if you want images to be publicly accessible
    // ACL: 'public-read',
  });

  // Generate presigned URL valid for 5 minutes
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  // Construct the public URL for the file
  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

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
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
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
    const urlPattern = new RegExp(`https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/(.+)`);
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


