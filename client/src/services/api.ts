import axios from "axios";

// Use relative path for CloudFront + ALB setup
// This will work with both CloudFront (production) and local development with proxy
const API_BASE_URL = "";

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
          window.location.href = "/";
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

  requestVerification: (email: string) =>
    api.post("/api/auth/request-verification", { email }),

  verifyCode: (email: string, code: string) =>
    api.post("/api/auth/verify-code", { email, code }),

  checkVerification: (email: string) =>
    api.get(`/api/auth/check-verification/${encodeURIComponent(email)}`),

  // Password Reset
  forgotPassword: (email: string) =>
    api.post("/api/auth/forgot-password", { email }),

  verifyResetCode: (email: string, code: string) =>
    api.post("/api/auth/verify-reset-code", { email, code }),

  verifyResetLink: (token: string) =>
    api.get(`/api/auth/verify-reset-link/${token}`, {
      headers: { Accept: "application/json" },
    }),

  resetPassword: (email: string, password: string, code?: string, token?: string) =>
    api.post("/api/auth/reset-password", { email, password, code, token }),
};

// Types based on backend API
export interface IListing {
  _id: string;
  listingId: string;
  title: string;
  description: string;
  price: number;
  status: "ACTIVE" | "SOLD";
  isHidden: boolean;
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

export interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  photo_url?: string | null;
  bio?: string | null;
  contact_info?: {
    phone?: string | null;
    address?: string | null;
    social_media?: {
      linkedin?: string | null;
      twitter?: string | null;
      instagram?: string | null;
    };
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

  // Update existing listing
  async updateListing(
    id: string,
    listingData: {
      title?: string;
      description?: string;
      price?: number;
      categoryId?: string;
      photos?: Array<{ url: string; alt: string }>;
      status?: "ACTIVE" | "SOLD";
    }
  ): Promise<{ success: boolean; listing: IListing }> {
    const { data } = await api.put<{ success: boolean; listing: IListing }>(
      `/api/listings/${id}`,
      listingData
    );
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

  async getUnreadMessagesCount(): Promise<{ unreadCount: number }> {
    const { data } = await api.get<{ unreadCount: number }>(
      "/api/chats/unread-count"
    );
    return data;
  }

  async getMessages(conversationId: string): Promise<{ messages: any[] }> {
    const { data } = await api.get(`/api/chats/${conversationId}/messages`);
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
    folder: "listings" | "profiles" = "listings",
    purpose?: "profile" | "listing"
  ): Promise<{ presignedUrl: string; key: string; publicUrl: string }> {
    const { data } = await api.post<{
      presignedUrl: string;
      key: string;
      publicUrl: string;
    }>("/api/upload/presigned-url", { 
      fileName, 
      fileType, 
      fileSize, 
      folder,
      purpose 
    });
    return data;
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

  // My Listings functionality - Get user's own listings
  async getMyListings(params?: {
    status?: "ACTIVE" | "SOLD";
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    listings: IListing[];
    pagination: {
      current: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { data } = await api.get("/api/listings/my-listings", { params });
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

  // Profile methods
  async getProfile(): Promise<ProfileData> {
    const { data } = await api.get<ProfileData>("/api/profile");
    return data;
  }

  async updateProfile(profileData: Partial<ProfileData>): Promise<ProfileData> {
    const { data } = await api.put<ProfileData>("/api/profile", profileData);
    return data;
  }

  // Admin: Toggle listing visibility (hide/restore)
  async toggleListingVisibility(
    listingId: string,
    isHidden: boolean
  ): Promise<{ success: boolean; message: string; data: { listing: IListing } }> {
    const { data } = await api.patch<{
      success: boolean;
      message: string;
      data: { listing: IListing };
    }>(`/api/admin/listings/${listingId}/visibility`, {
      isHidden,
    });
    return data;
  }

  // Admin: Suspend user account
  async suspendUser(
    userId: string,
    reason?: string,
    listingId?: string
  ): Promise<{ success: boolean; message: string }> {
    const { data } = await api.patch<{
      success: boolean;
      message: string;
    }>(`/api/admin/users/${userId}/suspend`, {
      reason,
      listingId,
    });
    return data;
  }

  // Admin: Delete user account
  async deleteUser(
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const { data } = await api.delete<{
      success: boolean;
      message: string;
    }>(`/api/admin/users/${userId}`, {
      data: { reason },
    });
    return data;
  }

  // Admin: Get suspended users
  async getSuspendedUsers(params?: {
    page?: number;
    limit?: number;
  }): Promise<any> {
    const { data } = await api.get("/api/admin/users/suspended", { params });
    return data;
  }

  // Admin: Unsuspend user
  async unsuspendUser(
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    const { data } = await api.patch<{
      success: boolean;
      message: string;
    }>(`/api/admin/users/${userId}/unsuspend`);
    return data;
  }

  // Update profile photo using S3 key
  async updateProfilePhoto(key: string, publicUrl?: string): Promise<{ success: boolean; user: any }> {
    const { data } = await api.put<{ success: boolean; user: any }>("/api/profile/photo", {
      key,
      publicUrl,
    });
    return data;
  }

  // Delete profile photo from S3 and set photoUrl = null in DB
  async deleteProfilePhoto(): Promise<{ success: boolean; user: any }> {
    const { data } = await api.delete<{ success: boolean; user: any }>("/api/profile/photo");
    return data;
  }
}

export const apiService = new ApiService();
export default api;
