import { Document, Types } from 'mongoose';

// Base interfaces for database documents
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: 'student' | 'admin';
  campusId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPhoto {
  url: string;
  alt: string;
}

export interface IListing extends Document {
  _id: Types.ObjectId;
  listingId: string;
  userId: Types.ObjectId | IUser;
  categoryId: Types.ObjectId | ICategory;
  title: string;
  description: string;
  price: number;
  status: 'ACTIVE' | 'SOLD';
  photos: IPhoto[];
  createdAt: Date;
  updatedAt: Date;
}

// API Request/Response types
export interface SearchQuery {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: 'createdAt_desc' | 'createdAt_asc' | 'price_desc' | 'price_asc';
  page?: string;
  pageSize?: string;
}

export interface PaginationInfo {
  current: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SearchResponse {
  items: IListing[];
  page: PaginationInfo;
}

export interface CategoryResponse {
  _id: string;
  name: string;
  description?: string;
}

// Seed data types
export interface SeedUser {
  name: string;
  email: string;
  role: 'student' | 'admin';
  campusId: string;
}

export interface SeedCategory {
  name: string;
  description: string;
}

export interface SeedListing {
  title: string;
  description: string;
  price: number;
  status: 'ACTIVE' | 'SOLD';
  photos: IPhoto[];
  categoryName: string;
}

// Express Request extensions
export interface AuthenticatedRequest extends Express.Request {
  user?: IUser;
}

// Error response type
export interface ErrorResponse {
  error: string;
}
