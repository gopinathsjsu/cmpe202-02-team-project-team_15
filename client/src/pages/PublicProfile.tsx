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
