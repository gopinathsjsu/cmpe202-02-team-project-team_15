import { Request, Response } from 'express';
import { User } from '../models/User';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('-password_hash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
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
    if (photo_url !== undefined) user.photo_url = photo_url;
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