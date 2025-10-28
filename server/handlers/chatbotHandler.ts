import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Listing from '../models/Listing';
import Category from '../models/Category';
import { IListing } from '../models/Listing';
import { ICategory } from '../models/Category';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}

// System prompt to ensure the chatbot only answers questions about listings and categories
const SYSTEM_PROMPT = `You are a helpful assistant for a campus marketplace application. You can only answer questions about:

1. Product listings (items for sale)
2. Product categories
3. General marketplace information

You CANNOT answer questions about:
- User account management
- Admin functions
- Authentication or login issues
- Personal user data
- System administration

If asked about restricted topics, politely redirect to appropriate support channels.

When answering questions about listings or categories, provide helpful, accurate information based on the context provided.

IMPORTANT RULES:
1. When mentioning specific listings, ALWAYS include clickable links using this format:
   <a href="/listing/[LISTING_ID]" target="_blank">[LISTING_TITLE]</a>
   For example: <a href="/listing/507f1f77bcf86cd799439011" target="_blank">MacBook Pro 13"</a>

2. ONLY mention items that actually exist in the listings provided. Do not assume items exist based on category names alone.

3. If a category has 0 active listings, clearly state that there are currently no items available in that category.


This allows users to click directly on the listing to view more details.`;

export const chatWithBot = async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory = [] }: ChatRequest = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemini API key not configured. Please set GEMINI_API_KEY in your environment variables.' 
      });
    }

    // Initialize Gemini AI client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Get relevant context from database
    const context = await getRelevantContext(message);

    // Prepare the prompt for Gemini
    const prompt = `${SYSTEM_PROMPT}

Context about our marketplace:
${context}

Conversation history:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User question: ${message}

Please provide a helpful response based on the context and conversation history.`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = result.response.text() || 'Sorry, I could not generate a response.';

    res.json({
      response,
      conversationHistory: [
        ...conversationHistory,
        { role: 'user' as const, content: message },
        { role: 'assistant' as const, content: response }
      ]
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Function to get relevant context from database
async function getRelevantContext(query: string): Promise<string> {
  try {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    // Get categories with actual listing counts
    const categories = await Category.find({}).limit(10);
    const categoryInfo = await Promise.all(categories.map(async (cat) => {
      const listingCount = await Listing.countDocuments({ 
        categoryId: cat._id, 
        status: 'ACTIVE' 
      });
      return `Category: ${cat.name}${cat.description ? ` - ${cat.description}` : ''} (${listingCount} active listings)`;
    }));
    const categoryInfoText = categoryInfo.join('\n');

    // Search for relevant listings
    let listings: IListing[] = [];
    
    if (searchTerms.length > 0) {
      // Create search regex for title and description
      const searchRegex = new RegExp(searchTerms.join('|'), 'i');
      
      listings = await Listing.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex }
        ],
        status: 'ACTIVE'
      })
      .populate('categoryId', 'name')
      .populate('userId', 'username')
      .limit(5)
      .sort({ createdAt: -1 });
    } else {
      // If no specific search terms, get recent listings
      listings = await Listing.find({ status: 'ACTIVE' })
        .populate('categoryId', 'name')
        .populate('userId', 'username')
        .limit(5)
        .sort({ createdAt: -1 });
    }

    const listingInfo = listings.map(listing => {
      const category = listing.categoryId as ICategory;
      const user = listing.userId as any;
      return `Listing ID: ${listing._id} - Title: "${listing.title}" - Price: $${listing.price} - Category: ${category?.name || 'Unknown'} - Description: ${listing.description.substring(0, 100)}...`;
    }).join('\n');

    // Get some general stats
    const totalListings = await Listing.countDocuments({ status: 'ACTIVE' });
    const totalCategories = await Category.countDocuments();

    return `
Available Categories:
${categoryInfoText}

Recent/Relevant Listings:
${listingInfo}

General Information:
- Total active listings: ${totalListings}
- Total categories: ${totalCategories}
- All listings are from campus community members
- Items are sold as-is
- Contact sellers directly for more information
    `.trim();

  } catch (error) {
    console.error('Error getting context:', error);
    return 'Database context unavailable.';
  }
}

// Get available categories for the chatbot
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({}).select('name description');
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Get recent listings for the chatbot
export const getRecentListings = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const listings = await Listing.find({ status: 'ACTIVE' })
      .populate('categoryId', 'name')
      .populate('userId', 'username')
      .limit(limit)
      .sort({ createdAt: -1 })
      .select('title price description categoryId userId createdAt');

    res.json({ listings });
  } catch (error) {
    console.error('Error fetching recent listings:', error);
    res.status(500).json({ error: 'Failed to fetch recent listings' });
  }
};
