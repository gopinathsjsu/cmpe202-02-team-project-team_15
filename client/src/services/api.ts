import axios from "axios";

const API_BASE_URL = "http://localhost:8080";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
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
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/api/auth/refresh`,
            {
              refreshToken,
            }
          );
          const { accessToken } = response.data.data;
          localStorage.setItem("accessToken", accessToken);
          // Retry the original request
          return api.request(error.config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post("/api/auth/login", { email, password }),

  signup: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    adminKey?: string
  ) => api.post("/api/auth/signup", adminKey ? { email, password, firstName, lastName, adminKey } : { email, password, firstName, lastName }),

  logout: (refreshToken: string) =>
    api.post("/api/auth/logout", { refreshToken }),

  refresh: (refreshToken: string) =>
    api.post("/api/auth/refresh", { refreshToken }),
};

// Types based on backend API
export interface IListing {
  _id: string;
  listingId: string;
  title: string;
  description: string;
  price: number;
  status: "ACTIVE" | "SOLD";
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
  sort?: "createdAt_desc" | "createdAt_asc" | "price_desc" | "price_asc";
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
    const { data } = await api.get<SearchResponse>("/api/listings/search", {
      params,
    });
    return data;
  }

  // Get all categories
  async getCategories(): Promise<ICategory[]> {
    const { data } = await api.get<{ categories: ICategory[] }>(
      "/api/listings/categories"
    );
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
    const { data } = await api.post<IListing>("/api/listings", listingData);
    return data;
  }

  // Chat functionality
  async initiateChat(listingId: string): Promise<{ conversation: any }> {
    const { data } = await api.post("/api/chats/initiate", { listingId });
    return data;
  }

  async getConversations(): Promise<{ conversations: any[] }> {
    const { data } = await api.get("/api/chats/");
    return data;
  }

  async getMessages(conversationId: string): Promise<{ messages: any[] }> {
    const { data } = await api.get(`/api/chats/${conversationId}/messages`);
    return data;
  }

  async sendMessage(conversationId: string, body: string): Promise<{ message: any }> {
    const { data } = await api.post(`/api/chats/${conversationId}/messages`, { body });
    return data;
  }

  // Chatbot API methods
  async chatWithBot(message: string, conversationHistory: any[] = []) {
    const { data } = await api.post('/api/chatbot/chat', {
      message,
      conversationHistory
    });
    return data;
  }

  async getChatbotCategories() {
    const { data } = await api.get('/api/chatbot/categories');
    return data;
  }

  async getRecentListings(limit: number = 10) {
    const { data } = await api.get(`/api/chatbot/listings?limit=${limit}`);
    return data;
  }

  // Report functionality
  async createReport(listingId: string, reportCategory: string, details?: string): Promise<{ report: any }> {
    const { data } = await api.post("/api/reports", { listingId, reportCategory, details });
    return data;
  }

  async getUserReports(status?: string, page = 1, limit = 20): Promise<{ reports: any[], pagination: any }> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    const { data } = await api.get(`/api/reports?${params.toString()}`);
    return data;
  }

  async getReport(reportId: string): Promise<{ report: any }> {
    const { data } = await api.get(`/api/reports/${reportId}`);
    return data;
  }

  // Admin: Get all reports with filters
  async getAdminReports(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    category?: string;
    from?: string;
    to?: string;
    q?: string;
    listingId?: string;
    sort?: string;
  }): Promise<{ reports: any[], pagination: any }> {
    const { data } = await api.get('/api/admin/reports', { params });
    return data.data; // Backend wraps in { success, data: { reports, pagination } }
  }
}

export const apiService = new ApiService();
export default api;
