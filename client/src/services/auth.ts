import api from './api';

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  signup: async (email: string, password: string, firstName: string, lastName: string, adminKey?: string) => {
    const response = await api.post('/api/auth/signup', { email, password, firstName, lastName, adminKey });
    return response.data;
  },

  logout: async () => {
    try {
      const response = await api.post('/api/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      // Even if server logout fails, we still want to clear local state
      return { success: true };
    }
  }
};