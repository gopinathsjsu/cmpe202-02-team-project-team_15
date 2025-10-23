import { Response } from "express";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import Listing from "../models/Listing";
import { User } from "../models/User";

export const initiateChat = async (req: any, res: Response) => {
  try {
    const { listingId } = req.body as { listingId: string };
    const buyerId = String(req.user._id);

    // Get the listing to find the seller
    const listing = await Listing.findById(listingId).select("userId");
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const sellerId = String(listing.userId);
    if (sellerId === buyerId)
      return res.status(400).json({ message: "Cannot chat with yourself" });

    const conversation = await Conversation.findOneAndUpdate(
      { listingId, buyerId, sellerId },
      { $setOnInsert: { listingId, buyerId, sellerId } },
      { new: true, upsert: true }
    );
    return res.json({ conversation });
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const listConversations = async (req: any, res: Response) => {
  const userId = String(req.user._id);
  const conversations = await Conversation.find({
    $or: [{ buyerId: userId }, { sellerId: userId }],
  })
    .populate({
      path: "listingId",
      select: "title price",
      model: "Listing",
    })
    .populate({
      path: "buyerId",
      select: "first_name last_name email",
      model: "User",
    })
    .populate({
      path: "sellerId",
      select: "first_name last_name email",
      model: "User",
    })
    .sort({ lastMessageAt: -1 })
    .lean();

  // console.log("listConversations - userId:", userId);
  // console.log("listConversations - conversations count:", conversations.length);
  // if (conversations.length > 0) {
  //   console.log('listConversations - first conversation:', JSON.stringify(conversations[0], null, 2));
  // }

  return res.json({ conversations });
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

  const msgs = await Message.find(q)
    .sort({ createdAt: -1 })
    .limit(Number(limit));
  await Message.updateMany(
    { _id: { $in: msgs.map((m) => m._id) }, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );
  return res.json({ messages: msgs.reverse() });
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

  const msg = await Message.create({
    conversationId,
    senderId: userId,
    body,
    readBy: [userId],
  });
  conv.lastMessageAt = new Date();
  await conv.save();
  return res.status(201).json({ message: msg });
};
