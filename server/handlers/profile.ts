import { Request, Response } from 'express';
import { User } from '../models/User';
import { UserRole } from '../models/UserRole';
import { headS3Object, constructPublicUrl, getS3Client, getBucketName } from '../utils/s3';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('-password_hash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Fetch user roles from UserRole collection
    const userRoles = await UserRole.find({ user_id: user._id }).populate('role_id');
    const roles = userRoles.map((ur: any) => ur.role_id?.name).filter(Boolean);
    
    // Return user data with roles
    res.json({
      ...user.toObject(),
      roles
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { 
      first_name, 
      last_name,
      photo_url,
      bio,
      contact_info
    } = req.body;
    
    // Validation for required fields
    if (!first_name || !last_name) {
      return res.status(400).json({ message: 'First name and last name are required' });
    }

    // Validate bio length if provided
    if (bio && bio.length > 500) {
      return res.status(400).json({ message: 'Bio must be less than 500 characters' });
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update required fields
    user.first_name = first_name;
    user.last_name = last_name;

    // Update optional fields if provided
    if (photo_url !== undefined) {
      user.photo_url = photo_url;
      user.photoUrl = photo_url; // Also update camelCase field
    }
    if (bio !== undefined) user.bio = bio;
    if (contact_info) {
      user.contact_info = {
        ...user.contact_info || {},
        ...contact_info
      };
    }

    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(user._id).select('-password_hash');
    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/profile/photo
 * Update user profile photo using S3 key
 * 
 * Request body: { key: string, publicUrl?: string }
 * 
 * Validates:
 * - Key format matches profiles/{userId}/...
 * - S3 object exists and is an image
 * - Updates user.photo_url in database
 */
export const updateProfilePhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    
    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
      return;
    }

    const { key, publicUrl } = req.body;

    // Validate key is provided
    if (!key || typeof key !== 'string') {
      res.status(400).json({ 
        success: false,
        message: 'Missing or invalid key' 
      });
      return;
    }

    // Basic validation: must start with profiles/{userId}/
    const userIdStr = userId.toString();
    const expectedPrefix = `profiles/${userIdStr}/`;
    
    if (!key.startsWith(expectedPrefix)) {
      res.status(403).json({ 
        success: false,
        message: 'Invalid key for user. Key must start with profiles/{userId}/' 
      });
      return;
    }

    // Optional: verify object exists and is an image
    try {
      const headResult = await headS3Object(key);
      
      if (!headResult.exists) {
        res.status(400).json({ 
          success: false,
          message: 'S3 object missing or inaccessible' 
        });
        return;
      }

      // Verify Content-Type is an image
      const contentType = headResult.contentType || '';
      if (!contentType.startsWith('image/')) {
        res.status(400).json({ 
          success: false,
          message: 'Uploaded file is not an image' 
        });
        return;
      }
    } catch (error: any) {
      console.error('S3 headObject error:', error);
      res.status(400).json({ 
        success: false,
        message: 'S3 object missing or inaccessible' 
      });
      return;
    }

    // Build public URL (use provided publicUrl or construct from key)
    const photoUrl = publicUrl || constructPublicUrl(key);

    // Update user photoUrl and photo_url in database (both for backward compatibility)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        photoUrl: photoUrl,
        photo_url: photoUrl  // Maintain backward compatibility
      },
      { new: true }
    ).select('-password_hash');

    if (!updatedUser) {
      res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
      return;
    }

    // Return updated user object (omit sensitive fields)
    res.json({ 
      success: true,
      user: updatedUser 
    });
  } catch (error: any) {
    console.error('Profile photo update error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error' 
    });
  }
};

/**
 * DELETE /api/profile/photo
 * Delete user profile photo from S3 and set photoUrl = null in DB
 */
export const deleteProfilePhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id || (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!user.photoUrl && !user.photo_url) {
      res.status(400).json({ message: 'No photo to delete' });
      return;
    }

    const photoUrl = user.photoUrl || user.photo_url;
    
    // Extract S3 key from URL (simple split method)
    const key = photoUrl.split('.com/')[1];
    
    if (key) {
      // Delete from S3 using AWS SDK v3
      const s3Client = getS3Client();
      const bucketName = getBucketName();

      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await s3Client.send(deleteCommand);
    }

    // Update user: set photoUrl and photo_url to null
    user.photoUrl = null;
    user.photo_url = null;
    await user.save();

    // Return updated user object (without password)
    const updatedUser = await User.findById(userId).select('-password_hash');
    
    res.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Profile photo delete error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};