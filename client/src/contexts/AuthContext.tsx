import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  roles: string[];
  photoUrl?: string | null;
  photo_url?: string | null; // Backward compatibility
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, firstName: string, lastName: string, adminKey?: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to store only minimal profile data in localStorage
  const storeMinimalProfileCache = (userData: User) => {
    const profileCache = {
      first_name: userData.first_name,
      last_name: userData.last_name,
      status: userData.status,
      photoUrl: userData.photoUrl || userData.photo_url || null,
    };
    localStorage.setItem('user', JSON.stringify(profileCache));
  };

  useEffect(() => {
    // HYDRATION PHASE: Read from localStorage when app starts
    const savedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    
    const fetchFullUserData = async () => {
      if (!accessToken) return;
      
      try {
        const response = await api.get("/api/profile");
        const profileData = response.data;
        const userData: User = {
          id: profileData._id || profileData.id,
          email: profileData.email,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          status: profileData.status,
          roles: profileData.roles || [],
          photoUrl: profileData.photoUrl || profileData.photo_url || null,
          photo_url: profileData.photo_url || profileData.photoUrl || null,
        };
        setUser(userData);
        // Store only minimal profile cache in localStorage
        storeMinimalProfileCache(userData);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        // If fetch fails and we have minimal cache, keep it
        // Otherwise clear invalid tokens
        if (!savedUser) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);
        }
      }
    };
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // If we only have minimal cache (missing id, email, or roles) and have a token,
        // fetch full user data to ensure we have complete user information
        if (accessToken && (!parsedUser.id || !parsedUser.email || !parsedUser.roles)) {
          // Fetch full user data asynchronously without blocking initial render
          fetchFullUserData();
        }
      } catch (err) {
        console.error('Failed to parse saved user:', err);
        localStorage.removeItem('user');
        if (accessToken) {
          fetchFullUserData();
        }
      }
    } else if (accessToken) {
      // No cached user but we have a token, fetch full user data
      fetchFullUserData();
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login(email, password);
      if (response.data.success) {
        localStorage.setItem('accessToken', response.data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
        
        // Fetch fresh user data from backend after login
        const profileResponse = await api.get("/api/profile");
        const profileData = profileResponse.data;
        const userData: User = {
          id: profileData._id || profileData.id,
          email: profileData.email,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          status: profileData.status,
          roles: profileData.roles || [],
          photoUrl: profileData.photoUrl || profileData.photo_url || null,
          photo_url: profileData.photo_url || profileData.photoUrl || null,
        };
        // Store only minimal profile cache in localStorage
        storeMinimalProfileCache(userData);
        setUser(userData);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      // Re-throw with the backend error message if available
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  };

  const signup = async (email: string, password: string, firstName: string, lastName: string, adminKey?: string): Promise<boolean> => {
    try {
      console.log('Attempting signup with:', { email, firstName, lastName });
      const response = await authAPI.signup(email, password, firstName, lastName, adminKey);
      console.log('Signup response:', response.data);
      return response.data.success;
    } catch (error: any) {
      console.error('Signup error:', error);
      console.error('Error response:', error.response?.data);
      return false;
    }
  };

  const refreshUser = async (): Promise<void> => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const response = await api.get("/api/profile");
      const profileData = response.data;
      const userData: User = {
        id: profileData._id || profileData.id,
        email: profileData.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        status: profileData.status,
        roles: profileData.roles || [],
        photoUrl: profileData.photoUrl || profileData.photo_url || null,
        photo_url: profileData.photo_url || profileData.photoUrl || null,
      };
      setUser(userData);
      // Store only minimal profile cache in localStorage
      storeMinimalProfileCache(userData);
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
      // Clear invalid token
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const logout = () => {
    const currentUserId = user?.id;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    try {
      // Remove all chatbot messages from localStorage on logout
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('chatbot:messages:')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      // Backward compatibility: clear specific keys if present
      if (currentUserId) localStorage.removeItem(`chatbot:messages:${currentUserId}`);
      localStorage.removeItem('chatbot:messages:guest');
    } catch (e) {
      // ignore localStorage errors
    }
    setUser(null);
  };

  const value = {
    user,
    setUser,
    login,
    signup,
    logout,
    refreshUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
