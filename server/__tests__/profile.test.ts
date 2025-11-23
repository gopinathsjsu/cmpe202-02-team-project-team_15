import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { updateProfilePhoto } from '../handlers/profile';

// Mock dependencies
jest.mock('../models/User', () => ({
  User: {
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock('../utils/s3', () => ({
  headS3Object: jest.fn(),
  constructPublicUrl: jest.fn(),
}));

import { User } from '../models/User';
import * as s3Utils from '../utils/s3';

describe('Profile Handler - Photo Update', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

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
  });

  describe('Valid Updates', () => {
    it('should update user.photoUrl in database after S3 validation', async () => {
      const validKey = 'profiles/507f1f77bcf86cd799439011/avatar-1234567890.jpg';
      const publicUrl = 'https://bucket.s3.region.amazonaws.com/' + validKey;

      mockRequest.body = {
        key: validKey,
        publicUrl: publicUrl,
      };

      // Mock S3 headObject - object exists and is image
      (s3Utils.headS3Object as jest.Mock).mockResolvedValue({
        exists: true,
        contentType: 'image/jpeg',
      });

      // Mock User.findByIdAndUpdate
      const mockUpdatedUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        photoUrl: publicUrl,
        photo_url: publicUrl,
      };

      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedUser);

      await updateProfilePhoto(mockRequest as Request, mockResponse as Response);

      // Verify S3 validation
      expect(s3Utils.headS3Object).toHaveBeenCalledWith(validKey);

      // Verify database update
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        {
          photoUrl: publicUrl,
          photo_url: publicUrl,
        },
        { new: true }
      );

      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        user: mockUpdatedUser,
      });
    });

    it('should validate S3 object exists before updating database', async () => {
      const validKey = 'profiles/507f1f77bcf86cd799439011/avatar-123.jpg';

      mockRequest.body = { key: validKey };

      // Mock S3 headObject - object exists
      (s3Utils.headS3Object as jest.Mock).mockResolvedValue({
        exists: true,
        contentType: 'image/png',
      });

      (s3Utils.constructPublicUrl as jest.Mock).mockReturnValue(
        'https://bucket.s3.region.amazonaws.com/' + validKey
      );

      const mockUpdatedUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        photoUrl: 'https://bucket.s3.region.amazonaws.com/' + validKey,
      };

      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedUser);

      await updateProfilePhoto(mockRequest as Request, mockResponse as Response);

      expect(s3Utils.headS3Object).toHaveBeenCalledWith(validKey);
      expect(User.findByIdAndUpdate).toHaveBeenCalled();
    });
  });

  describe('Invalid Updates', () => {
    it('should reject keys belonging to other users', async () => {
      const otherUserKey = 'profiles/507f1f77bcf86cd799439012/avatar-123.jpg';

      mockRequest.body = { key: otherUserKey };

      await updateProfilePhoto(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid key for user. Key must start with profiles/{userId}/',
      });

      // Verify database NOT updated
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should reject invalid key patterns', async () => {
      const invalidKey = 'listings/some-file.jpg';

      mockRequest.body = { key: invalidKey };

      await updateProfilePhoto(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should reject if S3 object does not exist', async () => {
      const validKey = 'profiles/507f1f77bcf86cd799439011/avatar-123.jpg';

      mockRequest.body = { key: validKey };

      // Mock S3 headObject - object does not exist
      (s3Utils.headS3Object as jest.Mock).mockResolvedValue({
        exists: false,
      });

      await updateProfilePhoto(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'S3 object missing or inaccessible',
      });

      // Verify database NOT updated
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should reject if Content-Type is not an image', async () => {
      const validKey = 'profiles/507f1f77bcf86cd799439011/avatar-123.jpg';

      mockRequest.body = { key: validKey };

      // Mock S3 headObject - exists but wrong Content-Type
      (s3Utils.headS3Object as jest.Mock).mockResolvedValue({
        exists: true,
        contentType: 'application/pdf',
      });

      await updateProfilePhoto(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Uploaded file is not an image',
      });

      // Verify database NOT updated
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      mockRequest.user = undefined;
      mockRequest.body = { key: 'profiles/123/avatar.jpg' };

      await updateProfilePhoto(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });
});

