import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { makeSocketRateLimiter } from "./rateLimit";

interface SocketUser {
  _id: string;
}

export function initSocket(server: HTTPServer) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN?.split(",") ?? [
        "http://localhost:5173",
      ],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token =
      (socket.handshake.auth as any)?.token ||
      (socket.handshake.headers.authorization as string | undefined)?.replace(
        "Bearer ",
        ""
      );
    if (!token) return next(new Error("Unauthorized"));
    try {
      (socket as any).user = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as SocketUser;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  const allow = makeSocketRateLimiter();

  io.on("connection", (socket) => {
    const user = (socket as any).user as SocketUser;

    socket.on("join-conversation", async (conversationId: string) => {
      const conv = await Conversation.findById(conversationId).select(
        "buyerId sellerId status"
      );
      if (!conv || conv.status === "blocked") return;
      const ok = [String(conv.buyerId), String(conv.sellerId)].includes(
        user._id
      );
      if (ok) socket.join(conversationId);
    });

    socket.on(
      "send-message",
      async ({
        conversationId,
        body,
      }: {
        conversationId: string;
        body: string;
      }) => {
        if (!allow(socket)) return;
        if (!body?.trim()) return;
        const conv = await Conversation.findById(conversationId).select(
          "buyerId sellerId status"
        );
        if (!conv || conv.status === "blocked") return;
        const ok = [String(conv.buyerId), String(conv.sellerId)].includes(
          user._id
        );
        if (!ok) return;
        const msg = await Message.create({
          conversationId,
          senderId: user._id,
          body,
          readBy: [user._id],
        });
        await Conversation.updateOne(
          { _id: conversationId },
          { $set: { lastMessageAt: new Date() } }
        );
        io.to(conversationId).emit("receive-message", {
          _id: String(msg._id),
          conversationId,
          senderId: user._id,
          body: msg.body,
          createdAt: msg.createdAt,
        });
      }
    );
  });
  return io;
}
