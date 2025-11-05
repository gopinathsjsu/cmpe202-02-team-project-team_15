import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

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
          try {
            // Clear all chatbot conversation history on auth failure
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('chatbot:messages:')) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach((k) => localStorage.removeItem(k));
          } catch (e) {
            // ignore localStorage errors
          }
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
  ) =>
    api.post(
      "/api/auth/signup",
      adminKey
        ? { email, password, firstName, lastName, adminKey }
        : { email, password, firstName, lastName }
    ),

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
    first_name: string;
    last_name: string;
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
  
  // Get current user's profile
  async getUserProfile(): Promise<any> {
    const { data } = await api.get('/api/users/profile');
    return data.data.user;
  }  // Create new listing
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

  // Update user profile
  async updateUserProfile(profile: { 
    first_name: string; 
    last_name: string; 
    email: string;
    bio?: string;
    contactNumber?: string;
    socialLinks?: {
      instagram?: string;
      facebook?: string;
      twitter?: string;
      linkedin?: string;
    };
  }) {
    const { data } = await api.put('/api/users/profile', profile);
    return data;
  }

  async sendMessage(
    conversationId: string,
    body: string
  ): Promise<{ message: any }> {
    const { data } = await api.post(`/api/chats/${conversationId}/messages`, {
      body,
    });
    return data;
  }

  // Chatbot API methods
  async chatWithBot(message: string, conversationHistory: any[] = []) {
    const { data } = await api.post("/api/chatbot/chat", {
      message,
      conversationHistory,
    });
    return data;
  }

  async getChatbotCategories() {
    const { data } = await api.get("/api/chatbot/categories");
    return data;
  }

  async getRecentListings(limit: number = 10) {
    const { data } = await api.get(`/api/chatbot/listings?limit=${limit}`);
    return data;
  }

  // Report functionality
  async createReport(
    listingId: string,
    reportCategory: string,
    details?: string
  ): Promise<{ report: any }> {
    const { data } = await api.post("/api/reports", {
      listingId,
      reportCategory,
      details,
    });
    return data;
  }

  async getUserReports(
    status?: string,
    page = 1,
    limit = 20
  ): Promise<{ reports: any[]; pagination: any }> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    const { data } = await api.get(`/api/reports?${params.toString()}`);
    return data;
  }

  async getReport(reportId: string): Promise<{ report: any }> {
    const { data } = await api.get(`/api/reports/${reportId}`);
    return data;
  }

  // Upload functionality - Generate presigned URL for single file
  async getPresignedUploadUrl(
    fileName: string,
    fileType: string,
    fileSize: number,
    folder: "listings" | "profiles" = "listings"
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    const { data } = await api.post<{
      success: boolean;
      data: { uploadUrl: string; fileUrl: string; key: string };
    }>("/api/upload/presigned-url", { fileName, fileType, fileSize, folder });
    return data.data;
  }

  // Upload functionality - Generate presigned URLs for multiple files
  async getBatchPresignedUploadUrls(
    files: Array<{ fileName: string; fileType: string; fileSize: number }>,
    folder: "listings" | "profiles" = "listings"
  ): Promise<Array<{ uploadUrl: string; fileUrl: string; key: string }>> {
    const { data } = await api.post<{
      success: boolean;
      data: Array<{ uploadUrl: string; fileUrl: string; key: string }>;
    }>("/api/upload/presigned-urls/batch", { files, folder });
    return data.data;
  }

  // Upload file to S3 using presigned URL
  async uploadFileToS3(presignedUrl: string, file: File): Promise<void> {
    try {
      const response = await axios.put(presignedUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
        // Don't send auth headers to S3
        transformRequest: [(data) => data],
      });

      return response.data;
    } catch (error: any) {
      console.error("S3 upload failed:", error.message);
      throw error;
    }
  }

  // Delete file from S3
  async deleteFileFromS3(key: string): Promise<void> {
    // Send key in request body
    await api.delete("/api/upload/delete", {
      data: { key },
    });
  }

  // Complete upload flow: Get presigned URL and upload file
  async uploadImage(
    file: File,
    folder: "listings" | "profiles" = "listings"
  ): Promise<{ fileUrl: string; key: string }> {
    // Step 1: Get presigned URL
    const { uploadUrl, fileUrl, key } = await this.getPresignedUploadUrl(
      file.name,
      file.type,
      file.size,
      folder
    );

    // Step 2: Upload file to S3
    await this.uploadFileToS3(uploadUrl, file);

    return { fileUrl, key };
  }

  // Complete upload flow for multiple files
  async uploadMultipleImages(
    files: File[],
    folder: "listings" | "profiles" = "listings"
  ): Promise<Array<{ fileUrl: string; key: string }>> {
    // Step 1: Get presigned URLs for all files
    const fileDetails = files.map((file) => ({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    }));

    const urlData = await this.getBatchPresignedUploadUrls(fileDetails, folder);

    // Step 2: Upload all files in parallel
    const uploadPromises = files.map((file, index) =>
      this.uploadFileToS3(urlData[index].uploadUrl, file)
    );

    await Promise.all(uploadPromises);

    // Return file URLs and keys
    return urlData.map((data) => ({
      fileUrl: data.fileUrl,
      key: data.key,
    }));
  }

  // Saved Listings functionality
  async saveListing(
    listingId: string
  ): Promise<{ message: string; savedListing: any }> {
    const { data } = await api.post("/api/saved-listings", { listingId });
    return data;
  }

  async unsaveListing(listingId: string): Promise<{ message: string }> {
    const { data } = await api.delete(`/api/saved-listings/${listingId}`);
    return data;
  }

  async getSavedListings(): Promise<{
    savedListings: Array<{
      savedId: string;
      savedAt: string;
      listing: IListing;
    }>;
    count: number;
  }> {
    const { data } = await api.get("/api/saved-listings");
    return data;
  }

  async checkIfSaved(listingId: string): Promise<{ isSaved: boolean }> {
    const { data } = await api.get(`/api/saved-listings/check/${listingId}`);
    return data;
  }

  async getSavedListingIds(): Promise<{ listingIds: string[] }> {
    const { data } = await api.get("/api/saved-listings/ids");
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
  }): Promise<{ reports: any[]; pagination: any }> {
    const { data } = await api.get("/api/admin/reports", { params });
    return data.data; // Backend wraps in { success, data: { reports, pagination } }
  }
  
  // Delete listing
  async deleteListing(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.delete<{ success: boolean; message: string }>(`/api/listings/${id}`);
    return data;
  }

  // Admin: Warn seller about listing violation
  async warnSeller(
    listingId: string,
    message?: string
  ): Promise<{ success: boolean; message: string; data: any }> {
    const { data } = await api.post<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/admin/listings/${listingId}/warn`, {
      message,
    });
    return data;
  }
}

export const apiService = new ApiService();
export default api;
