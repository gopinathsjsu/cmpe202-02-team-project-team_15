import express from "express";
// import cors from 'cors';
import cookieParser from "cookie-parser";

export const app = express();
// app.use(cors({ origin: process.env.FRONTEND_ORIGIN?.split(',') ?? '*', credentials: true }));
app.use(express.json());
app.use(cookieParser());
