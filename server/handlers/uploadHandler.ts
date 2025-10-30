import { Request, Response } from 'express';
import { generatePresignedUploadUrl, validateFile, deleteFileFromS3 } from '../utils/s3';

/**
 * POST /api/upload/presigned-url
 * Generate presigned URL for direct S3 upload
 */
export const getPresignedUploadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileName, fileType, fileSize, folder = 'listings' } = req.body;

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

    // Validate file type and size
    const validation = validateFile(fileType, parseInt(fileSize));
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: validation.error,
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

    // Generate presigned URL
    const urlData = await generatePresignedUploadUrl(fileName, fileType, folder);

    res.json({
      success: true,
      data: urlData,
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

    // Generate presigned URLs for all files
    const urlPromises = files.map((file) =>
      generatePresignedUploadUrl(file.fileName, file.fileType, folder)
    );

    const urlDataArray = await Promise.all(urlPromises);

    res.json({
      success: true,
      data: urlDataArray,
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

