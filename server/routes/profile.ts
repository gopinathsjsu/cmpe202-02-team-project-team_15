import express from 'express';
import { getProfile, updateProfile } from '../controllers/profile';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, getProfile);
router.put('/', authenticateToken, updateProfile);

export default router;