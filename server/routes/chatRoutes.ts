import { Router } from "express";
import { requireAuth } from "../middleware/authMock";
import {
  initiateChat,
  listConversations,
  getMessages,
  postMessage,
} from "../handlers/chat";

export const chatRouter = Router();

chatRouter.post("/initiate", requireAuth, initiateChat);
chatRouter.get("/", requireAuth, listConversations);
chatRouter.get("/:conversationId/messages", requireAuth, getMessages);
chatRouter.post("/:conversationId/messages", requireAuth, postMessage);
