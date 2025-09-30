import { Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { Product } from "../models/Product";

export const initiateChat = async (req: AuthedRequest, res: Response) => {
  try {
    // Assumed that the product schema has a productID to lookup the seller as binded that way.
    const { productId } = req.body as { productId: string };
    const buyerId = req.user!._id;

    // Seller should come from Product (defined in the prodcut schema (assumed there exists)).
    const product = await Product.findById(productId).select("sellerId");
    if (!product) return res.status(404).json({ message: "Product not found" });

    const sellerId = String(product.sellerId);
    if (sellerId === buyerId)
      return res.status(400).json({ message: "Cannot chat with yourself" });

    const conversation = await Conversation.findOneAndUpdate(
      { productId, buyerId, sellerId },
      { $setOnInsert: { productId, buyerId, sellerId } },
      { new: true, upsert: true }
    );
    return res.json({ conversation });
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const listConversations = async (req: AuthedRequest, res: Response) => {
  const userId = req.user!._id;
  const conversations = await Conversation.find({
    $or: [{ buyerId: userId }, { sellerId: userId }],
  })
    .sort({ lastMessageAt: -1 })
    .lean();
  return res.json({ conversations });
};

export const getMessages = async (req: AuthedRequest, res: Response) => {
  const { conversationId } = req.params as any;
  const { cursor, limit = 50 } = req.query as any;
  const userId = req.user!._id;

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

export const postMessage = async (req: AuthedRequest, res: Response) => {
  const { conversationId } = req.params as any;
  const { body } = req.body as { body: string };
  const userId = req.user!._id;

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
