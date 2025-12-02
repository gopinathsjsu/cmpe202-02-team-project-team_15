import express from 'express';
import { getProfile, updateProfile, updateProfilePhoto, deleteProfilePhoto } from '../handlers/profile';
import { authenticateToken } from '../middleware/auth';
import { profilePhotoRateLimit } from '../middleware/profilePhotoRateLimit';

const router = express.Router();

router.get('/', authenticateToken, getProfile);
router.put('/', authenticateToken, updateProfile);
router.put('/photo', authenticateToken, profilePhotoRateLimit, updateProfilePhoto);
router.delete('/photo', authenticateToken, deleteProfilePhoto);

export default router;