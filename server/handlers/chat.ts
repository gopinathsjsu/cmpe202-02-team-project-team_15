import { Response } from "express";
import { Types } from "mongoose";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import Listing from "../models/Listing";
import { User } from "../models/User";

export const initiateChat = async (req: any, res: Response) => {
  try {
    const { listingId } = req.body as { listingId: string };
    const buyerId = String(req.user._id);

    // Validate listingId is provided
    if (!listingId) {
      return res.status(400).json({ message: "Listing ID is required" });
    }

    // Get the listing to find the seller
    const listing = await Listing.findById(listingId).select("userId university");
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Check if buyer and listing are from the same university
    const buyer = await User.findById(req.user._id).select("university");
    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }
    
    // Check university access - users can only chat about listings from their university
    if (buyer.university && listing.university && buyer.university !== listing.university) {
      return res.status(403).json({ message: "Access denied: Listing belongs to a different university" });
    }

    const sellerId = String(listing.userId);
    
    if (sellerId === buyerId) {
      return res.status(400).json({ message: "Cannot chat with yourself" });
    }

    const conversation = await Conversation.findOneAndUpdate(
      { listingId, buyerId, sellerId },
      { $setOnInsert: { listingId, buyerId, sellerId } },
      { new: true, upsert: true }
    );
    
    return res.json({ conversation });
  } catch (e: any) {
    console.error('Chat initiation error:', e);
    return res.status(500).json({ message: "Server error" });
  }
};

export const listConversations = async (req: any, res: Response) => {
  const userId = String(req.user._id);
  const userObjectId = new Types.ObjectId(userId);
  const conversations = await Conversation.find({
    $or: [{ buyerId: userId }, { sellerId: userId }],
  })
    .populate({
      path: "listingId",
      select: "title price photos listingId",
      model: "Listing",
    })
    .populate({
      path: "buyerId",
      select: "first_name last_name email photoUrl photo_url",
      model: "User",
    })
    .populate({
      path: "sellerId",
      select: "first_name last_name email photoUrl photo_url",
      model: "User",
    })
    .sort({ lastMessageAt: -1 })
    .lean();

  const conversationIds = conversations.map((conv: any) => conv._id);
  let unreadCountsMap = new Map<string, number>();

  if (conversationIds.length > 0) {
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
          readBy: { $ne: userObjectId },
          senderId: { $ne: userObjectId },
        },
      },
      {
        $group: {
          _id: "$conversationId",
          count: { $sum: 1 },
        },
      },
    ]);

    unreadCountsMap = new Map(
      unreadCounts.map((item) => [
        String(item._id),
        item.count as number,
      ])
    );
  }

  const conversationsWithUnread = conversations.map((conv: any) => ({
    ...conv,
    unreadCount: unreadCountsMap.get(String(conv._id)) || 0,
  }));

  return res.json({ conversations: conversationsWithUnread });
};

export const getUnreadCount = async (req: any, res: Response) => {
  const userId = String(req.user._id);
  const userObjectId = new Types.ObjectId(userId);

  const userConversations = await Conversation.find({
    $or: [{ buyerId: userId }, { sellerId: userId }],
  })
    .select("_id")
    .lean();

  if (userConversations.length === 0) {
    return res.json({ unreadCount: 0 });
  }

  const conversationIds = userConversations.map((conv: any) => conv._id);

  const unreadResult = await Message.aggregate([
    {
      $match: {
        conversationId: { $in: conversationIds },
        readBy: { $ne: userObjectId },
        senderId: { $ne: userObjectId },
      },
    },
    {
      $count: "count",
    },
  ]);

  const unreadCount = unreadResult.length > 0 ? unreadResult[0].count : 0;

  return res.json({ unreadCount });
};

export const getMessages = async (req: any, res: Response) => {
  const { conversationId } = req.params as any;
  const { cursor, limit = 50 } = req.query as any;
  const userId = String(req.user._id);

  const conv = await Conversation.findById(conversationId);
  if (!conv) return res.status(404).json({ message: "Conversation not found" });
  if (![String(conv.buyerId), String(conv.sellerId)].includes(userId))
    return res.status(403).json({ message: "Forbidden" });

  const q: any = { conversationId };
  if (cursor) q.createdAt = { $lt: new Date(cursor) };

  // Fetch messages with explicit field selection including senderProfileImage
  const msgs = await Message.find(q)
    .select("body senderId senderProfileImage readBy createdAt conversationId")
    .populate({
      path: "senderId",
      select: "first_name last_name email photoUrl photo_url",
      model: "User",
    })
    .sort({ createdAt: -1 })
    .limit(Number(limit));
  
  await Message.updateMany(
    { _id: { $in: msgs.map((m) => m._id) }, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );
  
  // Ensure senderProfileImage is always included in response
  // Use cached value if available, otherwise fallback to populated sender data
  const messagesWithProfile = msgs.map((msg: any) => {
    const senderProfileImage = msg.senderProfileImage || 
                              msg.senderId?.photoUrl || 
                              msg.senderId?.photo_url || 
                              null;
    return {
      _id: msg._id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      body: msg.body,
      senderProfileImage, // Always include senderProfileImage in response
      readBy: msg.readBy,
      createdAt: msg.createdAt,
    };
  });
  
  return res.json({ messages: messagesWithProfile.reverse() });
};

export const postMessage = async (req: any, res: Response) => {
  const { conversationId } = req.params as any;
  const { body } = req.body as { body: string };
  const userId = String(req.user._id);

  if (!body?.trim()) return res.status(400).json({ message: "Empty message" });

  const conv = await Conversation.findById(conversationId);
  if (!conv) return res.status(404).json({ message: "Conversation not found" });
  if (conv.status === "blocked")
    return res.status(403).json({ message: "Conversation blocked" });
  if (![String(conv.buyerId), String(conv.sellerId)].includes(userId))
    return res.status(403).json({ message: "Forbidden" });

  // Get sender's profile image before creating message
  // This ensures every message carries the sender's image
  const sender = await User.findById(userId).select('photoUrl photo_url first_name last_name');
  const senderProfileImage = sender?.photoUrl || sender?.photo_url || null;

  const msg = await Message.create({
    conversationId,
    senderId: userId,
    body,
    readBy: [userId],
    senderProfileImage, // Store sender's profile image (cached for performance)
  });
  conv.lastMessageAt = new Date();
  await conv.save();
  return res.status(201).json({ message: msg });
};
