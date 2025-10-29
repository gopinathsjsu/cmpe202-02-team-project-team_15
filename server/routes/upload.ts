import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getPresignedUploadUrl,
  getBatchPresignedUploadUrls,
  deleteFile,
} from '../handlers/uploadHandler';

const router = express.Router();

/**
 * @route   POST /api/upload/presigned-url
 * @desc    Generate a presigned URL for single file upload
 * @access  Private
 */
router.post('/presigned-url', authenticateToken, getPresignedUploadUrl);

/**
 * @route   POST /api/upload/presigned-urls/batch
 * @desc    Generate presigned URLs for multiple file uploads (max 5)
 * @access  Private
 */
router.post('/presigned-urls/batch', authenticateToken, getBatchPresignedUploadUrls);

/**
 * @route   DELETE /api/upload/delete
 * @desc    Delete a file from S3 (expects key in request body)
 * @access  Private
 */
router.delete('/delete', authenticateToken, deleteFile);

export default router;

