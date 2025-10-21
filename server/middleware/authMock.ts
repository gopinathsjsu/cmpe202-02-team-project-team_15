// Checker line for the PR.

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
export interface AuthedUser {
  _id: string;
  role?: string;
}
export interface AuthedRequest extends Request {
  user?: AuthedUser;
}

// WHY: Keep controllers business‑only; centralize security here.
export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Missing token" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as AuthedUser;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
