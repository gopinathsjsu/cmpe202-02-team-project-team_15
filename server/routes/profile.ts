import express from 'express';
import { getProfile, updateProfile, updateProfilePhoto } from '../handlers/profile';
import { authenticateToken } from '../middleware/auth';
import { profilePhotoRateLimit } from '../middleware/profilePhotoRateLimit';

const router = express.Router();

router.get('/', authenticateToken, getProfile);
router.put('/', authenticateToken, updateProfile);
// Security: Rate limit profile photo updates to prevent abuse
router.put('/photo', authenticateToken, profilePhotoRateLimit, updateProfilePhoto);

export default router;