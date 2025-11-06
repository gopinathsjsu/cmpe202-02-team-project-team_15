import api from './api';

export interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  photo_url?: string | null;
  bio?: string;
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

export const getProfile = async (): Promise<ProfileData> => {
  const response = await api.get('/api/profile');
  return response.data;
};

export const updateProfile = async (data: Partial<ProfileData>): Promise<ProfileData> => {
  const response = await api.put('/api/profile', data);
  return response.data;
};