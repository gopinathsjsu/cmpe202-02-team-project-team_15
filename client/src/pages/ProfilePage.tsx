import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    contactNumber: user?.contactNumber || '',
    socialLinks: {
      instagram: user?.socialLinks?.instagram || '',
      facebook: user?.socialLinks?.facebook || '',
      twitter: user?.socialLinks?.twitter || '',
      linkedin: user?.socialLinks?.linkedin || '',
    }
  });

  // Fetch latest user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const profile = await apiService.getUserProfile();
        setUser(profile);
        setForm({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: profile.email || '',
          bio: profile.bio || '',
          contactNumber: profile.contactNumber || '',
          socialLinks: {
            instagram: profile.socialLinks?.instagram || '',
            facebook: profile.socialLinks?.facebook || '',
            twitter: profile.socialLinks?.twitter || '',
            linkedin: profile.socialLinks?.linkedin || '',
          }
        });
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('socialLinks.')) {
      const key = name.split('.')[1];
      setForm({
        ...form,
        socialLinks: {
          ...form.socialLinks,
          [key]: value,
        },
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    // Validate first name
    if (!form.first_name.trim()) {
      errors.push('First name is required');
    } else if (form.first_name.trim().length < 2) {
      errors.push('First name must be at least 2 characters');
    } else if (form.first_name.trim().length > 50) {
      errors.push('First name must be less than 50 characters');
    } else if (!/^[a-zA-Z\s'-]+$/.test(form.first_name.trim())) {
      errors.push('First name can only contain letters, spaces, hyphens, and apostrophes');
    }

    // Validate last name
    if (!form.last_name.trim()) {
      errors.push('Last name is required');
    } else if (form.last_name.trim().length < 2) {
      errors.push('Last name must be at least 2 characters');
    } else if (form.last_name.trim().length > 50) {
      errors.push('Last name must be less than 50 characters');
    } else if (!/^[a-zA-Z\s'-]+$/.test(form.last_name.trim())) {
      errors.push('Last name can only contain letters, spaces, hyphens, and apostrophes');
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      errors.push('Email is required');
    } else if (!emailRegex.test(form.email.trim())) {
      errors.push('Invalid email format');
    }

    // Validate bio
    if (form.bio.trim().length > 500) {
      errors.push('Bio must be less than 500 characters');
    }

    // Validate contact number
    if (form.contactNumber.trim().length > 0) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      const digitsOnly = form.contactNumber.replace(/\D/g, '');
      if (!phoneRegex.test(form.contactNumber.trim())) {
        errors.push('Contact number can only contain digits, spaces, hyphens, plus signs, and parentheses');
      } else if (digitsOnly.length < 10) {
        errors.push('Contact number must have at least 10 digits');
      } else if (form.contactNumber.trim().length > 20) {
        errors.push('Contact number must be less than 20 characters');
      }
    }

    // Validate social links
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    
    if (form.socialLinks.instagram.trim().length > 0) {
      if (!urlRegex.test(form.socialLinks.instagram.trim())) {
        errors.push('Invalid Instagram URL format');
      } else if (form.socialLinks.instagram.trim().length > 200) {
        errors.push('Instagram URL must be less than 200 characters');
      }
    }

    if (form.socialLinks.facebook.trim().length > 0) {
      if (!urlRegex.test(form.socialLinks.facebook.trim())) {
        errors.push('Invalid Facebook URL format');
      } else if (form.socialLinks.facebook.trim().length > 200) {
        errors.push('Facebook URL must be less than 200 characters');
      }
    }

    if (form.socialLinks.twitter.trim().length > 0) {
      if (!urlRegex.test(form.socialLinks.twitter.trim())) {
        errors.push('Invalid Twitter URL format');
      } else if (form.socialLinks.twitter.trim().length > 200) {
        errors.push('Twitter URL must be less than 200 characters');
      }
    }

    if (form.socialLinks.linkedin.trim().length > 0) {
      if (!urlRegex.test(form.socialLinks.linkedin.trim())) {
        errors.push('Invalid LinkedIn URL format');
      } else if (form.socialLinks.linkedin.trim().length > 200) {
        errors.push('LinkedIn URL must be less than 200 characters');
      }
    }

    return errors;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      setLoading(false);
      return;
    }

    try {
      // Update profile API call
      await apiService.updateUserProfile(form);
      // Fetch updated profile and sync context/localStorage
      const updatedProfile = await apiService.getUserProfile();
      setUser(updatedProfile);
      setForm({
        first_name: updatedProfile.first_name || '',
        last_name: updatedProfile.last_name || '',
        email: updatedProfile.email || '',
        bio: updatedProfile.bio || '',
        contactNumber: updatedProfile.contactNumber || '',
        socialLinks: {
          instagram: updatedProfile.socialLinks?.instagram || '',
          facebook: updatedProfile.socialLinks?.facebook || '',
          twitter: updatedProfile.socialLinks?.twitter || '',
          linkedin: updatedProfile.socialLinks?.linkedin || '',
        }
      });
      // Optionally update localStorage
      localStorage.setItem('user', JSON.stringify(updatedProfile));
      setSuccess('Profile updated successfully!');
      setEditMode(false);
    } catch (err: any) {
      // Check if backend returned validation errors
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.join('. '));
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to update profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-8">Please log in to view your profile.</div>;

  if (isLoadingProfile) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl">
      <div className="flex flex-col items-center gap-4">
        <div className="w-28 h-28 rounded-full border-4 border-blue-400 shadow-lg flex items-center justify-center text-5xl font-bold text-blue-600 bg-gradient-to-br from-blue-100 to-blue-300 mb-2">
          {user.first_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <h2 className="text-3xl font-bold mb-1 text-gray-900">{user.first_name || ''} {user.last_name || ''}</h2>
        <p className="text-lg text-gray-500 mb-2">{user.email || ''}</p>
        <div className="w-full flex flex-col md:flex-row gap-6 justify-between mt-4">
          <div className="flex-1">
            <div className="mb-2">
              <span className="font-semibold text-gray-700">Bio:</span>
              <div className="text-gray-700 mt-1">{user.bio || <span className="italic text-gray-400">No bio yet</span>}</div>
            </div>
            <div className="mb-2">
              <span className="font-semibold text-gray-700">Contact:</span>
              <div className="text-gray-700 mt-1">{user.contactNumber || <span className="italic text-gray-400">No contact number</span>}</div>
            </div>
          </div>
          <div className="flex-1">
            <span className="font-semibold text-gray-700">Social Links:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {user.socialLinks?.instagram && <a href={user.socialLinks.instagram} className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200" target="_blank" rel="noopener noreferrer"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 3.25a5.25 5.25 0 1 1 0 10.5 5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5zm5.25.75a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>Instagram</a>}
              {user.socialLinks?.facebook && <a href={user.socialLinks.facebook} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200" target="_blank" rel="noopener noreferrer"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.522-4.478-10-10-10S2 6.478 2 12c0 5.019 3.676 9.163 8.438 9.877v-6.987h-2.54v-2.89h2.54V9.797c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.89h-2.33v6.987C18.324 21.163 22 17.019 22 12z"/></svg>Facebook</a>}
              {user.socialLinks?.twitter && <a href={user.socialLinks.twitter} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-400 rounded-full hover:bg-blue-100" target="_blank" rel="noopener noreferrer"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.59-2.47.69a4.3 4.3 0 0 0 1.88-2.37c-.83.49-1.75.85-2.72 1.04A4.28 4.28 0 0 0 16.11 4c-2.37 0-4.29 1.92-4.29 4.29 0 .34.04.67.1.99C7.69 9.13 4.07 7.38 1.64 4.9c-.37.64-.58 1.38-.58 2.17 0 1.5.76 2.83 1.92 3.61-.71-.02-1.38-.22-1.97-.54v.05c0 2.1 1.49 3.85 3.47 4.25-.36.1-.74.16-1.13.16-.28 0-.54-.03-.8-.08.54 1.68 2.12 2.9 3.99 2.93A8.6 8.6 0 0 1 2 19.54c-.56 0-1.11-.03-1.65-.1A12.13 12.13 0 0 0 8.29 21c7.55 0 11.69-6.26 11.69-11.69 0-.18-.01-.36-.02-.54A8.18 8.18 0 0 0 22.46 6z"/></svg>Twitter</a>}
              {user.socialLinks?.linkedin && <a href={user.socialLinks.linkedin} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-200 text-blue-800 rounded-full hover:bg-blue-300" target="_blank" rel="noopener noreferrer"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm13.5 10.28h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.38v4.59h-3v-9h2.88v1.23h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.59v4.74z"/></svg>LinkedIn</a>}
              {!user.socialLinks?.instagram && !user.socialLinks?.facebook && !user.socialLinks?.twitter && !user.socialLinks?.linkedin && <span className="italic text-gray-400">No social links</span>}
            </div>
          </div>
        </div>
        {!editMode && (
          <button
            className="mt-6 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-full font-semibold shadow hover:from-blue-600 hover:to-blue-500 transition"
            onClick={() => setEditMode(true)}
          >
            Edit Profile
          </button>
        )}
      </div>
      {editMode && (
        <form className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleUpdate}>
          <div>
            <label className="block text-gray-700 mb-1 font-semibold">First Name</label>
            <input
              type="text"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200"
              maxLength={50}
              minLength={2}
              pattern="[a-zA-Z\s'\-]+"
              title="First name can only contain letters, spaces, hyphens, and apostrophes"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 font-semibold">Last Name</label>
            <input
              type="text"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200"
              maxLength={50}
              minLength={2}
              pattern="[a-zA-Z\s'\-]+"
              title="Last name can only contain letters, spaces, hyphens, and apostrophes"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 font-semibold">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 font-semibold">Bio</label>
            <input
              type="text"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200"
              maxLength={500}
              placeholder="Tell us about yourself"
            />
            <small className="text-gray-500">{form.bio.length}/500 characters</small>
          </div>
          <div>
            <label className="block text-gray-700 mb-1 font-semibold">Contact Number</label>
            <input
              type="tel"
              name="contactNumber"
              value={form.contactNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200"
              maxLength={20}
              pattern="[\d\s\-\+\(\)]+"
              title="Contact number can only contain digits, spaces, hyphens, plus signs, and parentheses"
              placeholder="Your phone number"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 font-semibold">Instagram</label>
            <input
              type="url"
              name="socialLinks.instagram"
              value={form.socialLinks.instagram}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-pink-200"
              maxLength={200}
              placeholder="https://instagram.com/username"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 font-semibold">Facebook</label>
            <input
              type="url"
              name="socialLinks.facebook"
              value={form.socialLinks.facebook}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200"
              maxLength={200}
              placeholder="https://facebook.com/username"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 font-semibold">Twitter</label>
            <input
              type="url"
              name="socialLinks.twitter"
              value={form.socialLinks.twitter}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-blue-100"
              maxLength={200}
              placeholder="https://twitter.com/username"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 font-semibold">LinkedIn</label>
            <input
              type="url"
              name="socialLinks.linkedin"
              value={form.socialLinks.linkedin}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-blue-300"
              maxLength={200}
              placeholder="https://linkedin.com/in/username"
            />
          </div>
          <div className="md:col-span-2">
            {error && <div className="text-red-500 mb-2">{error}</div>}
            {success && <div className="text-green-500 mb-2">{success}</div>}
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="px-6 py-2 bg-green-500 text-white rounded-full font-semibold shadow hover:bg-green-600 transition"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-full font-semibold shadow hover:bg-gray-400 transition"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProfilePage;
