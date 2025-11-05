import express from 'express';
import { getProfile, updateProfile } from '../handlers/profile';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();


export default router;