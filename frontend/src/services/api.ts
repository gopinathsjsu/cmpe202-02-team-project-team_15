import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Types based on backend API
export interface IListing {
  _id: string;
  listingId: string;
  title: string;
  description: string;
  price: number;
  status: 'ACTIVE' | 'SOLD';
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  categoryId: {
    _id: string;
    name: string;
  };
  photos: Array<{
    url: string;
    alt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  _id: string;
  name: string;
  description?: string;
}

export interface SearchParams {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'createdAt_desc' | 'createdAt_asc' | 'price_desc' | 'price_asc';
  page?: number;
  pageSize?: number;
}

export interface SearchResponse {
  items: IListing[];
  page: {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

class ApiService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  // Search listings with filters
  async searchListings(params: SearchParams = {}): Promise<SearchResponse> {
    const response = await this.api.get<SearchResponse>('/api/listings/search', { params });
    return response.data;
  }

  // Get all categories
  async getCategories(): Promise<ICategory[]> {
    const response = await this.api.get<ICategory[]>('/api/listings/categories');
    return response.data;
  }

  // Get single listing by ID
  async getListingById(id: string): Promise<IListing> {
    const response = await this.api.get<IListing>(`/api/listings/${id}`);
    return response.data;
  }
}

export const apiService = new ApiService();
