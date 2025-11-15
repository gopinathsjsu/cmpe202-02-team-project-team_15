import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { IListing } from '../services/api';
import api from '../services/api';

interface PublicUser {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  photo_url?: string;
  bio?: string;
  contact_info?: {
    phone?: string;
    address?: string;
    social_media?: {
      linkedin?: string;
      twitter?: string;
      instagram?: string;
    };
  };
  created_at: string;
}

const PublicProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeListings, setActiveListings] = useState<IListing[]>([]);
  const [soldListings, setSoldListings] = useState<IListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'SOLD'>('ACTIVE');

  useEffect(() => {
    const loadPublicProfile = async () => {
      if (!userId) {
        setError('User ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching public profile for user ID:', userId);
        const response = await api.get(`/api/users/public/${userId}`);
        console.log('Public profile response:', response.data);
        if (response.data.success) {
          setUser(response.data.data.user);
        } else {
          setError('Failed to load user profile');
        }
      } catch (err: any) {
        console.error('Public profile load error:', err);
        console.error('Error response:', err.response);
        setError(err.response?.data?.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    loadPublicProfile();
  }, [userId]);

  useEffect(() => {
    const loadListings = async () => {
      if (!userId) return;

      try {
        setListingsLoading(true);
        
        // Fetch active listings
        const activeResponse = await api.get(`/api/listings/user/${userId}`, {
          params: { status: 'ACTIVE' }
        });
        setActiveListings(activeResponse.data.listings || []);

        // Fetch sold listings
        const soldResponse = await api.get(`/api/listings/user/${userId}`, {
          params: { status: 'SOLD' }
        });
        setSoldListings(soldResponse.data.listings || []);
      } catch (err: any) {
        console.error('Failed to load listings:', err);
      } finally {
        setListingsLoading(false);
      }
    };

    loadListings();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-600">{error || 'Unable to load this profile'}</p>
          </div>
        </div>
      </div>
    );
  }

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Cover Photo */}
          <div className="h-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"></div>

          {/* Profile Content */}
          <div className="px-6 sm:px-8 pb-8">
            {/* Profile Photo */}
            <div className="-mt-16 mb-4">
              <div className="inline-block">
                <div className="h-32 w-32 rounded-full ring-4 ring-white bg-gray-200 flex items-center justify-center overflow-hidden">
                  {user.photo_url ? (
                    <img 
                      src={user.photo_url} 
                      alt={user.full_name} 
                      className="h-32 w-32 rounded-full object-cover" 
                    />
                  ) : (
                    <span className="text-5xl text-gray-400 font-semibold">
                      {user.first_name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {user.full_name}
                </h1>
                <div className="flex items-center gap-2 mt-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Member since {memberSince}</span>
                </div>
              </div>

              {/* Contact Info */}
              {(user.contact_info?.phone || user.contact_info?.address) && (
                <div className="border-t border-gray-200 pt-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">Contact Information</h2>
                  <div className="space-y-2">
                    {user.contact_info.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-sm">{user.contact_info.phone}</span>
                      </div>
                    )}
                    {user.contact_info.address && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm">{user.contact_info.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Social Media Links */}
              {(user.contact_info?.social_media?.linkedin || 
                user.contact_info?.social_media?.twitter || 
                user.contact_info?.social_media?.instagram) && (
                <div className="border-t border-gray-200 pt-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3">Social Media</h2>
                  <div className="flex items-center gap-3">
                    {user.contact_info.social_media.linkedin && (
                      <a
                        href={user.contact_info.social_media.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 transition-all duration-200 transform hover:scale-110"
                        title="LinkedIn"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M17.04 17.043h-2.962v-4.64c0-1.107-.023-2.531-1.544-2.531-1.544 0-1.78 1.204-1.78 2.449v4.722H7.793V7.5h2.844v1.3h.039c.397-.75 1.37-1.54 2.818-1.54 3.014 0 3.572 1.984 3.572 4.564v5.22zM4.448 6.194c-.954 0-1.727-.773-1.727-1.727s.773-1.727 1.727-1.727 1.727.773 1.727 1.727-.773 1.727-1.727 1.727zm1.482 10.849h-2.96V7.5h2.96v9.543z" />
                        </svg>
                      </a>
                    )}
                    
                    {user.contact_info.social_media.twitter && (
                      <a
                        href={user.contact_info.social_media.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-600 hover:text-sky-700 transition-all duration-200 transform hover:scale-110"
                        title="Twitter"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.615 11.615 0 006.29 1.84" />
                        </svg>
                      </a>
                    )}
                    
                    {user.contact_info.social_media.instagram && (
                      <a
                        href={user.contact_info.social_media.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-100 hover:bg-pink-200 text-pink-600 hover:text-pink-700 transition-all duration-200 transform hover:scale-110"
                        title="Instagram"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2.2a24.6 24.6 0 0 1 3.2.1 4.1 4.1 0 0 1 1.5.3c.4.1.7.3 1 .5.3.3.5.6.7 1 .2.3.3.7.3 1.5.1.8.1 1.1.1 3.2v2.4a24.6 24.6 0 0 1-.1 3.2c0 .8-.1 1.2-.3 1.5-.2.4-.4.7-.7 1-.3.3-.6.5-1 .7-.3.2-.7.3-1.5.3-.8.1-1.1.1-3.2.1H7.8a24.6 24.6 0 0 1-3.2-.1 4.1 4.1 0 0 1-1.5-.3c-.4-.2-.7-.4-1-.7-.3-.3-.5-.6-.7-1-.2-.3-.3-.7-.3-1.5-.1-.8-.1-1.1-.1-3.2V7.8c0-2.1 0-2.4.1-3.2 0-.8.1-1.2.3-1.5.2-.4.4-.7.7-1 .3-.2.6-.4 1-.7.3-.2.7-.3 1.5-.3.8-.1 1.1-.1 3.2-.1H10m0-1.5h-2.4c-2.2 0-2.5 0-3.3.1-.9 0-1.5.2-2 .4a4.3 4.3 0 0 0-1.6 1C.4 1.6.2 2 0 2.6-.1 3.1-.2 3.7-.2 4.6v5.2c0 2.2 0 2.5.1 3.3.1.9.2 1.5.4 2a4.3 4.3 0 0 0 1 1.6c.4.3.8.5 1.4.7.5.1 1.1.2 2 .3h5.2c2.2 0 2.5 0 3.3-.1.9-.1 1.5-.2 2-.4a4.3 4.3 0 0 0 1.6-1c.3-.4.5-.8.7-1.4.1-.5.2-1.1.3-2v-5.2c0-2.2 0-2.5-.1-3.3-.1-.9-.2-1.5-.4-2a4.3 4.3 0 0 0-1-1.6c-.4-.3-.8-.5-1.4-.7-.5-.1-1.1-.2-2-.3h-3.3zm0 4.1a5.2 5.2 0 1 1 0 10.4 5.2 5.2 0 0 1 0-10.4zm0 8.6a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8zm6.8-8.8a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Bio */}
              {user.bio && (
                <div className="border-t border-gray-200 pt-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2">About</h2>
                  <p className="text-gray-600 whitespace-pre-wrap">{user.bio}</p>
                </div>
              )}

              {/* Read-only notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Public Profile View</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      You are viewing this user's public profile. Only they can edit their information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('ACTIVE')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'ACTIVE'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Active Listings ({activeListings.length})
                </button>
                <button
                  onClick={() => setActiveTab('SOLD')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'SOLD'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Sold Listings ({soldListings.length})
                </button>
              </nav>
            </div>

            {/* Listings Content */}
            <div className="p-6">
              {listingsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {activeTab === 'ACTIVE' && (
                    <>
                      {activeListings.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            No Active Listings
                          </h3>
                          <p className="text-gray-600">
                            {user?.first_name} doesn't have any active listings yet!
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {activeListings.map((listing) => (
                            <ProductCard key={listing._id} listing={listing} />
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'SOLD' && (
                    <>
                      {soldListings.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            No Sold Listings
                          </h3>
                          <p className="text-gray-600">
                            {user?.first_name} doesn't have any sold listings yet!
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {soldListings.map((listing) => (
                            <ProductCard key={listing._id} listing={listing} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
