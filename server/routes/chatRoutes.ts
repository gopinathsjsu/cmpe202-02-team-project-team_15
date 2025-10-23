import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  initiateChat,
  listConversations,
  getMessages,
  postMessage,
} from "../handlers/chat";

export const chatRouter = Router();

chatRouter.post("/initiate", authenticateToken, initiateChat);
chatRouter.get("/", authenticateToken, listConversations);
chatRouter.get("/:conversationId/messages", authenticateToken, getMessages);
chatRouter.post("/:conversationId/messages", authenticateToken, postMessage);
