import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService, ProfileData, IListing } from '../services/api';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    photo_url: null,
    bio: '',
    contact_info: {
      phone: null,
      address: null,
      social_media: {
        linkedin: null,
        twitter: null,
        instagram: null
      }
    }
  });
  const [originalData, setOriginalData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    photo_url: null,
    bio: '',
    contact_info: {
      phone: null,
      address: null,
      social_media: {
        linkedin: null,
        twitter: null,
        instagram: null
      }
    }
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [listings, setListings] = useState<IListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [listingFilter, setListingFilter] = useState<'ACTIVE' | 'SOLD'>('ACTIVE');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await apiService.getProfile();
        setFormData(data);
        setOriginalData(data); // Store original data
      } catch (err) {
        setError('Failed to load profile');
        console.error('Profile load error:', err);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoadingListings(true);
        const response = await apiService.getMyListings({ status: listingFilter });
        setListings(response.listings);
      } catch (err) {
        console.error('Failed to load listings:', err);
      } finally {
        setLoadingListings(false);
      }
    };
    loadListings();
  }, [listingFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Send all form data except email (which is read-only)
      const { email, ...updateData } = formData;
      await apiService.updateProfile(updateData);
      setSuccess('Profile updated successfully');
      setOriginalData(formData); // Update original data after successful save
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile');
      console.error('Profile update error:', err);
    }
  };

  const handleCancel = () => {
    // Deep copy to ensure proper reset, handling null/undefined values
    setFormData(JSON.parse(JSON.stringify(originalData)));
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Handle nested object properties (contact_info.phone, contact_info.social_media.twitter, etc)
    if (name.includes('.')) {
      const parts = name.split('.');
      setFormData(prev => {
        // Deep clone to prevent mutation of originalData
        let newData = JSON.parse(JSON.stringify(prev));
        let current: any = newData;
        
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
        
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
    <div className="min-h-screen bg-gray-50 py-8">
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your personal information and contact details
          </p>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Notification Messages */}
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}
          
          {success && (
            <div className="mb-6 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Success</h3>
                  <div className="mt-2 text-sm text-green-700">{success}</div>
                </div>
              </div>
            </div>
          )}

        <div className="space-y-8">
          {/* Main Card */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
              {/* Cover Photo Area */}
              <div className="h-40 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-t-lg"></div>
              
              {/* Profile Section */}
              <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-0">
            {/* Profile Photo and Info */}
            <div className="-mt-12 flex items-start gap-5">
              <div className="flex-shrink-0">
                <div className="h-24 w-24 rounded-full ring-4 ring-white bg-gray-200 flex items-center justify-center overflow-hidden">
                  {formData.photo_url ? (
                    <img src={formData.photo_url} alt="Profile" className="h-24 w-24 rounded-full object-cover" />
                  ) : (
                    <span className="text-4xl text-gray-400">{formData.first_name?.[0]?.toUpperCase()}</span>
                  )}
                </div>
              </div>
              
              {/* Name, Email and Social Links */}
              <div className="flex-1 pt-16">
                <h2 className="text-2xl font-bold text-gray-900">
                  {formData.first_name} {formData.last_name}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <p className="text-sm text-gray-500">{formData.email}</p>
                  
                  {/* Social Media Links - Inline with email */}
                  {(formData.contact_info?.social_media?.linkedin || 
                    formData.contact_info?.social_media?.twitter || 
                    formData.contact_info?.social_media?.instagram) && (
                    <>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center gap-2">
                        {formData.contact_info?.social_media?.linkedin && (
                          <a
                            href={formData.contact_info.social_media.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 transition-all duration-200 transform hover:scale-110"
                            title="LinkedIn"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M17.04 17.043h-2.962v-4.64c0-1.107-.023-2.531-1.544-2.531-1.544 0-1.78 1.204-1.78 2.449v4.722H7.793V7.5h2.844v1.3h.039c.397-.75 1.37-1.54 2.818-1.54 3.014 0 3.572 1.984 3.572 4.564v5.22zM4.448 6.194c-.954 0-1.727-.773-1.727-1.727s.773-1.727 1.727-1.727 1.727.773 1.727 1.727-.773 1.727-1.727 1.727zm1.482 10.849h-2.96V7.5h2.96v9.543z" />
                            </svg>
                          </a>
                        )}
                        
                        {formData.contact_info?.social_media?.twitter && (
                          <a
                            href={formData.contact_info.social_media.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-7 h-7 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-600 hover:text-sky-700 transition-all duration-200 transform hover:scale-110"
                            title="Twitter"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.615 11.615 0 006.29 1.84" />
                            </svg>
                          </a>
                        )}
                        
                        {formData.contact_info?.social_media?.instagram && (
                          <a
                            href={formData.contact_info.social_media.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-7 h-7 rounded-full bg-pink-100 hover:bg-pink-200 text-pink-600 hover:text-pink-700 transition-all duration-200 transform hover:scale-110"
                            title="Instagram"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 2.2a24.6 24.6 0 0 1 3.2.1 4.1 4.1 0 0 1 1.5.3c.4.1.7.3 1 .5.3.3.5.6.7 1 .2.3.3.7.3 1.5.1.8.1 1.1.1 3.2v2.4a24.6 24.6 0 0 1-.1 3.2c0 .8-.1 1.2-.3 1.5-.2.4-.4.7-.7 1-.3.3-.6.5-1 .7-.3.2-.7.3-1.5.3-.8.1-1.1.1-3.2.1H7.8a24.6 24.6 0 0 1-3.2-.1 4.1 4.1 0 0 1-1.5-.3c-.4-.2-.7-.4-1-.7-.3-.3-.5-.6-.7-1-.2-.3-.3-.7-.3-1.5-.1-.8-.1-1.1-.1-3.2V7.8c0-2.1 0-2.4.1-3.2 0-.8.1-1.2.3-1.5.2-.4.4-.7.7-1 .3-.2.6-.4 1-.7.3-.2.7-.3 1.5-.3.8-.1 1.1-.1 3.2-.1H10m0-1.5h-2.4c-2.2 0-2.5 0-3.3.1-.9 0-1.5.2-2 .4a4.3 4.3 0 0 0-1.6 1C.4 1.6.2 2 0 2.6-.1 3.1-.2 3.7-.2 4.6v5.2c0 2.2 0 2.5.1 3.3.1.9.2 1.5.4 2a4.3 4.3 0 0 0 1 1.6c.4.3.8.5 1.4.7.5.1 1.1.2 2 .3h5.2c2.2 0 2.5 0 3.3-.1.9-.1 1.5-.2 2-.4a4.3 4.3 0 0 0 1.6-1c.3-.4.5-.8.7-1.4.1-.5.2-1.1.3-2v-5.2c0-2.2 0-2.5-.1-3.3-.1-.9-.2-1.5-.4-2a4.3 4.3 0 0 0-1-1.6c-.4-.3-.8-.5-1.4-.7-.5-.1-1.1-.2-2-.3h-3.3zm0 4.1a5.2 5.2 0 1 1 0 10.4 5.2 5.2 0 0 1 0-10.4zm0 8.6a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8zm6.8-8.8a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information Card */}
        <div className="bg-white shadow rounded-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
            <div className="h-px flex-1 bg-gray-200 mx-4"></div>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {/* First Name */}
            <div className="space-y-2">
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 after:content-['*'] after:ml-0.5 after:text-red-500">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                id="first_name"
                value={formData.first_name || ''}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors duration-200 px-3 py-2"
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                id="last_name"
                value={formData.last_name || ''}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 px-3 py-2"
              />
            </div>

            {/* Email */}
            <div className="sm:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email || ''}
                disabled={true}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 text-gray-500 px-3 py-2"
              />
              <p className="mt-1 text-sm text-gray-500">Your email address cannot be changed</p>
            </div>
          </div>
        </div>

        {/* About Me Card */}
        <div className="bg-white shadow rounded-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">About Me</h3>
            <div className="h-px flex-1 bg-gray-200 mx-4"></div>
          </div>
          <div className="space-y-3">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              name="bio"
              id="bio"
              rows={5}
              value={formData.bio || ''}
              onChange={handleChange}
              disabled={!isEditing}
              maxLength={500}
              placeholder={isEditing ? "Tell us about yourself..." : "No bio provided"}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors duration-200 resize-none px-3 py-2"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-500">Write a short introduction about yourself</p>
              {isEditing && (
                <p className="text-sm text-gray-500 font-medium">{(formData.bio?.length || 0)}/500 characters</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="bg-white shadow rounded-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Contact Information</h3>
            <div className="h-px flex-1 bg-gray-200 mx-4"></div>
          </div>
          <div className="space-y-8">
            {/* Phone and Address */}
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="contact_info.phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="contact_info.phone"
                  id="contact_info.phone"
                  value={formData.contact_info?.phone || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder={isEditing ? "(123) 456-7890" : "No phone number provided"}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors duration-200 px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="contact_info.address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  name="contact_info.address"
                  id="contact_info.address"
                  value={formData.contact_info?.address || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder={isEditing ? "Your address" : "No address provided"}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 px-3 py-2"
                />
              </div>
            </div>

            {/* Social Media */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-base font-medium text-gray-900 mb-6">Social Media Profiles</h4>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <label htmlFor="contact_info.social_media.linkedin" className="block text-sm font-medium text-gray-700">
                    LinkedIn
                  </label>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.04 17.043h-2.962v-4.64c0-1.107-.023-2.531-1.544-2.531-1.544 0-1.78 1.204-1.78 2.449v4.722H7.793V7.5h2.844v1.3h.039c.397-.75 1.37-1.54 2.818-1.54 3.014 0 3.572 1.984 3.572 4.564v5.22zM4.448 6.194c-.954 0-1.727-.773-1.727-1.727s.773-1.727 1.727-1.727 1.727.773 1.727 1.727-.773 1.727-1.727 1.727zm1.482 10.849h-2.96V7.5h2.96v9.543z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="contact_info.social_media.linkedin"
                      id="contact_info.social_media.linkedin"
                      value={formData.contact_info?.social_media?.linkedin || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder={isEditing ? "LinkedIn URL" : "No LinkedIn profile"}
                      className="pl-10 pr-3 py-2 mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors duration-200"
                    />
                  </div>
                </div>
                  <div className="space-y-2">
                    <label htmlFor="contact_info.social_media.twitter" className="block text-sm font-medium text-gray-700">
                      Twitter
                    </label>
                    <div className="relative rounded-lg">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.615 11.615 0 006.29 1.84" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="contact_info.social_media.twitter"
                        id="contact_info.social_media.twitter"
                        value={formData.contact_info?.social_media?.twitter || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Twitter URL" : "No Twitter profile"}
                        className="pl-10 pr-3 py-2 mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="contact_info.social_media.instagram" className="block text-sm font-medium text-gray-700">
                      Instagram
                    </label>
                    <div className="relative rounded-lg">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2.2a24.6 24.6 0 0 1 3.2.1 4.1 4.1 0 0 1 1.5.3c.4.1.7.3 1 .5.3.3.5.6.7 1 .2.3.3.7.3 1.5.1.8.1 1.1.1 3.2v2.4a24.6 24.6 0 0 1-.1 3.2c0 .8-.1 1.2-.3 1.5-.2.4-.4.7-.7 1-.3.3-.6.5-1 .7-.3.2-.7.3-1.5.3-.8.1-1.1.1-3.2.1H7.8a24.6 24.6 0 0 1-3.2-.1 4.1 4.1 0 0 1-1.5-.3c-.4-.2-.7-.4-1-.7-.3-.3-.5-.6-.7-1-.2-.3-.3-.7-.3-1.5-.1-.8-.1-1.1-.1-3.2V7.8c0-2.1 0-2.4.1-3.2 0-.8.1-1.2.3-1.5.2-.4.4-.7.7-1 .3-.2.6-.4 1-.7.3-.2.7-.3 1.5-.3.8-.1 1.1-.1 3.2-.1H10m0-1.5h-2.4c-2.2 0-2.5 0-3.3.1-.9 0-1.5.2-2 .4a4.3 4.3 0 0 0-1.6 1C.4 1.6.2 2 0 2.6-.1 3.1-.2 3.7-.2 4.6v5.2c0 2.2 0 2.5.1 3.3.1.9.2 1.5.4 2a4.3 4.3 0 0 0 1 1.6c.4.3.8.5 1.4.7.5.1 1.1.2 2 .3h5.2c2.2 0 2.5 0 3.3-.1.9-.1 1.5-.2 2-.4a4.3 4.3 0 0 0 1.6-1c.3-.4.5-.8.7-1.4.1-.5.2-1.1.3-2v-5.2c0-2.2 0-2.5-.1-3.3-.1-.9-.2-1.5-.4-2a4.3 4.3 0 0 0-1-1.6c-.4-.3-.8-.5-1.4-.7-.5-.1-1.1-.2-2-.3h-3.3zm0 4.1a5.2 5.2 0 1 1 0 10.4 5.2 5.2 0 0 1 0-10.4zm0 8.6a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8zm6.8-8.8a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/>
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="contact_info.social_media.instagram"
                        id="contact_info.social_media.instagram"
                        value={formData.contact_info?.social_media?.instagram || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Instagram URL" : "No Instagram profile"}
                        className="pl-10 pr-3 py-2 mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Form Actions */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-end space-x-4">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" clipRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                      </svg>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Listings Section */}
        <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Listings</h2>
                <p className="mt-1 text-sm text-gray-600">
                  View and manage your listings
                </p>
              </div>
              {/* Toggle Filter */}
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setListingFilter('ACTIVE')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    listingFilter === 'ACTIVE'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setListingFilter('SOLD')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                    listingFilter === 'SOLD'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Sold
                </button>
              </div>
            </div>
          </div>
          <div className="px-8 py-6">
            {loadingListings ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No {listingFilter.toLowerCase()} listings
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {listingFilter === 'ACTIVE' 
                    ? 'Get started by creating a new listing' 
                    : 'You have no sold listings yet'}
                </p>
                {listingFilter === 'ACTIVE' && (
                  <div className="mt-6">
                    <button
                      onClick={() => navigate('/create-listing')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg
                        className="-ml-1 mr-2 h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Create New Listing
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <ProductCard
                    key={listing._id}
                    listing={listing}
                    onClick={() => navigate(`/listing/${listing._id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default Profile;