import express from "express";
// import cors from 'cors';
import cookieParser from "cookie-parser";
import { chatRouter } from "./routes/chatRoutes";

export const app = express();
// app.use(cors({ origin: process.env.FRONTEND_ORIGIN?.split(',') ?? '*', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/chats", chatRouter);
