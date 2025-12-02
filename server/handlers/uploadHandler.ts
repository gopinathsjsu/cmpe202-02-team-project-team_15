import { Request, Response } from 'express';
import { generatePresignedUploadUrl, validateFile, deleteFileFromS3 } from '../utils/s3';

/**
 * POST /api/upload/presigned-url
 * Generate presigned URL for direct S3 upload
 * 
 * Request body:
 * - fileName: string (required)
 * - fileType: string (required, MIME type)
 * - fileSize: number (required)
 * - folder: 'listings' | 'profiles' (optional, default: 'listings')
 * - purpose: 'profile' | 'listing' (optional)
 * - expiresIn: number (optional, 60-300 seconds, default: 300)
 * 
 * Response:
 * {
 *   "presignedUrl": "<PUT URL>",
 *   "key": "profiles/{userId}/avatar-<timestamp>.jpg",
 *   "publicUrl": "https://cdn.example.com/profiles/..."
 * }
 */
export const getPresignedUploadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileName, fileType, fileSize, folder = 'listings', purpose, expiresIn } = req.body;

    // Validate required fields
    if (!fileName || !fileType || !fileSize) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: fileName, fileType, fileSize',
      });
      return;
    }

    // Ensure user is authenticated
    const authUser = (req as any).user;
    if (!authUser || !authUser._id) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate and guard purpose field
    if (purpose && purpose !== 'profile' && purpose !== 'listing') {
      res.status(400).json({
        success: false,
        error: 'Invalid purpose. Must be "profile" or "listing"',
      });
      return;
    }

    // If purpose is 'profile', ensure folder is 'profiles'
    if (purpose === 'profile' && folder !== 'profiles') {
      res.status(400).json({
        success: false,
        error: 'When purpose is "profile", folder must be "profiles"',
      });
      return;
    }

    // Validate folder type
    if (folder !== 'listings' && folder !== 'profiles') {
      res.status(400).json({
        success: false,
        error: 'Invalid folder. Must be "listings" or "profiles"',
      });
      return;
    }

    // Validate file type and size
    const validation = validateFile(fileType, parseInt(fileSize));
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: validation.error,
      });
      return;
    }

    // Validate expiration time if provided
    let expirationTime = 300; // Default: 5 minutes
    if (expiresIn !== undefined) {
      const expiresInNum = parseInt(expiresIn);
      if (isNaN(expiresInNum) || expiresInNum < 60 || expiresInNum > 300) {
        res.status(400).json({
          success: false,
          error: 'expiresIn must be a number between 60 and 300 seconds',
        });
        return;
      }
      expirationTime = expiresInNum;
    }

    // Get userId for profile uploads
    const userId = authUser._id.toString();

    // Security: Additional validation - ensure purpose matches folder
    if (purpose === 'profile' && folder !== 'profiles') {
      res.status(400).json({
        success: false,
        error: 'Security: When purpose is "profile", folder must be "profiles"',
      });
      return;
    }

    // Generate presigned URL with purpose support
    // Security: Key generation is restricted server-side to prevent unauthorized uploads
    const urlData = await generatePresignedUploadUrl(
      fileName,
      fileType,
      folder,
      purpose,
      userId,
      expirationTime
    );

    // Return in the requested format
    res.json({
      presignedUrl: urlData.presignedUrl,
      key: urlData.key,
      publicUrl: urlData.publicUrl,
    });
  } catch (error: any) {
    console.error('Presigned URL generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate upload URL',
    });
  }
};

/**
 * POST /api/upload/presigned-urls/batch
 * Generate multiple presigned URLs for batch upload
 */
export const getBatchPresignedUploadUrls = async (req: Request, res: Response): Promise<void> => {
  try {
    const { files, folder = 'listings' } = req.body;

    // Validate required fields
    if (!files || !Array.isArray(files) || files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid files array',
      });
      return;
    }

    // Limit to 5 files per batch
    if (files.length > 5) {
      res.status(400).json({
        success: false,
        error: 'Maximum 5 files allowed per batch',
      });
      return;
    }

    // Ensure user is authenticated
    const authUser = (req as any).user;
    if (!authUser || !authUser._id) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate folder type
    if (folder !== 'listings' && folder !== 'profiles') {
      res.status(400).json({
        success: false,
        error: 'Invalid folder. Must be "listings" or "profiles"',
      });
      return;
    }

    // Validate all files
    for (const file of files) {
      if (!file.fileName || !file.fileType || !file.fileSize) {
        res.status(400).json({
          success: false,
          error: 'Each file must have fileName, fileType, and fileSize',
        });
        return;
      }

      const validation = validateFile(file.fileType, parseInt(file.fileSize));
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: `File ${file.fileName}: ${validation.error}`,
        });
        return;
      }
    }

    // Get userId for potential profile uploads
    const userId = authUser._id.toString();

    // Generate presigned URLs for all files
    const urlPromises = files.map((file) =>
      generatePresignedUploadUrl(file.fileName, file.fileType, folder, undefined, userId)
    );

    const urlDataArray = await Promise.all(urlPromises);

    // Map to maintain backward compatibility with existing frontend code
    const mappedData = urlDataArray.map((item) => ({
      uploadUrl: item.presignedUrl,
      fileUrl: item.publicUrl,
      key: item.key,
      // Also include new format for future use
      presignedUrl: item.presignedUrl,
      publicUrl: item.publicUrl,
    }));

    res.json({
      success: true,
      data: mappedData,
    });
  } catch (error: any) {
    console.error('Batch presigned URL generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate upload URLs',
    });
  }
};

/**
 * DELETE /api/upload/delete
 * Delete a file from S3 by its key (passed in request body)
 */
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract S3 key from request body
    const { key } = req.body;

    if (!key || typeof key !== 'string' || !key.trim()) {
      res.status(400).json({
        success: false,
        error: 'Missing file key in request body',
      });
      return;
    }

    // Ensure user is authenticated
    const authUser = (req as any).user;
    if (!authUser || !authUser._id) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Delete file from S3
    await deleteFileFromS3(key);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error: any) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete file',
    });
  }
};

