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
  private readonly api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  // Search listings with filters
  async searchListings(params: SearchParams = {}): Promise<SearchResponse> {
    const { data } = await this.api.get<SearchResponse>('/api/listings/search', { params });
    return data;
  }

  // Get all categories
  async getCategories(): Promise<ICategory[]> {
    const { data } = await this.api.get<{ categories: ICategory[] }>('/api/listings/categories');
    return data.categories;
  }

  // Get single listing by ID
  async getListingById(id: string): Promise<IListing> {
    const { data } = await this.api.get<IListing>(`/api/listings/${id}`);
    return data;
  }
}

export const apiService = new ApiService();
