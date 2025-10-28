import express from 'express';
import { chatWithBot, getCategories, getRecentListings } from '../handlers/chatbotHandler';

const router = express.Router();

// Chat with the bot
router.post('/chat', chatWithBot);

// Get available categories
router.get('/categories', getCategories);

// Get recent listings
router.get('/listings', getRecentListings);

export default router;
