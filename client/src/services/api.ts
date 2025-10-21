import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken
          });
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          // Retry the original request
          return api.request(error.config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  
  signup: (email: string, password: string, first_name: string, last_name: string) =>
    api.post('/api/auth/register', { email, password, first_name, last_name }),
  
  logout: (refreshToken: string) =>
    api.post('/api/auth/logout', { refreshToken }),
  
  refresh: (refreshToken: string) =>
    api.post('/api/auth/refresh', { refreshToken }),
};

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
  // Search listings with filters
  async searchListings(params: SearchParams = {}): Promise<SearchResponse> {
    const { data } = await api.get<SearchResponse>('/api/listings/search', { params });
    return data;
  }

  // Get all categories
  async getCategories(): Promise<ICategory[]> {
    const { data } = await api.get<{ categories: ICategory[] }>('/api/listings/categories');
    return data.categories;
  }

  // Get single listing by ID
  async getListingById(id: string): Promise<IListing> {
    const { data } = await api.get<IListing>(`/api/listings/${id}`);
    return data;
  }

  // Create new listing
  async createListing(listingData: {
    title: string;
    description: string;
    price: number;
    categoryId: string;
    photos?: Array<{ url: string; alt: string }>;
  }): Promise<IListing> {
    const { data } = await api.post<IListing>('/api/listings', listingData);
    return data;
  }
}

export const apiService = new ApiService();
export default api;
