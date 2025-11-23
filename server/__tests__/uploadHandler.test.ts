import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { getPresignedUploadUrl } from '../handlers/uploadHandler';

// Mock S3 utils
jest.mock('../utils/s3', () => ({
  generatePresignedUploadUrl: jest.fn(),
  validateFile: jest.fn(),
}));

import * as s3Utils from '../utils/s3';

describe('Upload Handler - Presigned URL Endpoint', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
      user: {
        _id: '507f1f77bcf86cd799439011',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('Valid Requests', () => {
    it('should return presigned URL with correct key pattern for profile upload', async () => {
      mockRequest.body = {
        fileName: 'avatar.jpg',
        fileType: 'image/jpeg',
        fileSize: 1024000,
        folder: 'profiles',
        purpose: 'profile',
      };

      const mockPresignedData = {
        presignedUrl: 'https://s3.amazonaws.com/bucket/...',
        key: 'profiles/507f1f77bcf86cd799439011/avatar-1234567890.jpg',
        publicUrl: 'https://bucket.s3.region.amazonaws.com/profiles/...',
      };

      (s3Utils.generatePresignedUploadUrl as jest.Mock).mockResolvedValue(mockPresignedData);

      await getPresignedUploadUrl(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        presignedUrl: mockPresignedData.presignedUrl,
        key: mockPresignedData.key,
        publicUrl: mockPresignedData.publicUrl,
      });

      // Verify key pattern
      expect(mockPresignedData.key).toMatch(/^profiles\/507f1f77bcf86cd799439011\/avatar-\d+\.(jpg|jpeg|png|webp)$/);
    });

    it('should validate expiration time is between 60-300 seconds', async () => {
      mockRequest.body = {
        fileName: 'avatar.jpg',
        fileType: 'image/jpeg',
        fileSize: 1024000,
        folder: 'profiles',
        purpose: 'profile',
        expiresIn: 300,
      };

      const mockPresignedData = {
        presignedUrl: 'https://s3.amazonaws.com/...',
        key: 'profiles/507f1f77bcf86cd799439011/avatar-123.jpg',
        publicUrl: 'https://bucket.s3.region.amazonaws.com/...',
      };

      (s3Utils.generatePresignedUploadUrl as jest.Mock).mockResolvedValue(mockPresignedData);

      await getPresignedUploadUrl(mockRequest as Request, mockResponse as Response);

      expect(s3Utils.generatePresignedUploadUrl).toHaveBeenCalledWith(
        'avatar.jpg',
        'image/jpeg',
        'profiles',
        'profile',
        '507f1f77bcf86cd799439011',
        300
      );
    });
  });

  describe('Invalid Requests', () => {
    it('should reject invalid file types', async () => {
      mockRequest.body = {
        fileName: 'document.pdf',
        fileType: 'application/pdf',
        fileSize: 1024000,
        folder: 'profiles',
        purpose: 'profile',
      };

      (s3Utils.validateFile as jest.Mock).mockReturnValue({
        valid: false,
        error: 'Invalid file type. Allowed types: image/jpeg, image/png, image/webp',
      });

      await getPresignedUploadUrl(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid file type. Allowed types: image/jpeg, image/png, image/webp',
      });
    });

    it('should reject files exceeding size limit', async () => {
      mockRequest.body = {
        fileName: 'large.jpg',
        fileType: 'image/jpeg',
        fileSize: 15 * 1024 * 1024, // 15MB
        folder: 'profiles',
        purpose: 'profile',
      };

      (s3Utils.validateFile as jest.Mock).mockReturnValue({
        valid: false,
        error: 'File size exceeds maximum limit of 10MB',
      });

      await getPresignedUploadUrl(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'File size exceeds maximum limit of 10MB',
      });
    });

    it('should require authentication', async () => {
      mockRequest.user = undefined;

      await getPresignedUploadUrl(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
    });

    it('should reject invalid purpose values', async () => {
      mockRequest.body = {
        fileName: 'avatar.jpg',
        fileType: 'image/jpeg',
        fileSize: 1024000,
        folder: 'profiles',
        purpose: 'invalid',
      };

      await getPresignedUploadUrl(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid purpose. Must be "profile" or "listing"',
      });
    });
  });
});

