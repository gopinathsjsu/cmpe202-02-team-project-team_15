import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Package, Plus } from 'lucide-react';
import BackButton from '../components/BackButton';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { apiService, IListing } from '../services/api';

const MyListings = () => {
  const navigate = useNavigate();
  const [myListings, setMyListings] = useState<IListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'SOLD'>('ALL');
  const [savedListingIds, setSavedListingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMyListings();
    fetchSavedListingIds();
  }, [filterStatus]);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = filterStatus !== 'ALL' ? { status: filterStatus as 'ACTIVE' | 'SOLD' } : {};
      const response = await apiService.getMyListings(params);
      setMyListings(response.listings);
    } catch (err: any) {
      console.error('Failed to fetch my listings:', err);
      setError('Failed to load your listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedListingIds = async () => {
    try {
      const response = await apiService.getSavedListingIds();
      setSavedListingIds(new Set(response.listingIds));
    } catch (err) {
      console.error('Failed to fetch saved listing IDs:', err);
    }
  };

  const handleListingClick = (listing: IListing) => {
    navigate(`/listing/${listing._id}`);
  };

  const handleSaveToggle = async (listingId: string, isSaved: boolean) => {
    try {
      if (isSaved) {
        await apiService.saveListing(listingId);
        setSavedListingIds(prev => new Set([...prev, listingId]));
      } else {
        await apiService.unsaveListing(listingId);
        setSavedListingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(listingId);
          return newSet;
        });
      }
    } catch (err) {
      console.error('Failed to toggle save status:', err);
    }
  };

  const filteredListings = myListings;
  const activeCount = myListings.filter(l => l.status === 'ACTIVE').length;
  const soldCount = myListings.filter(l => l.status === 'SOLD').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton />
          <div className="mt-8 text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <button 
              onClick={fetchMyListings}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton />

        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
            <button
              onClick={() => navigate('/create-listing')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create New Listing
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`pb-3 px-1 font-medium transition-colors ${
                filterStatus === 'ALL'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All ({myListings.length})
            </button>
            <button
              onClick={() => setFilterStatus('ACTIVE')}
              className={`pb-3 px-1 font-medium transition-colors ${
                filterStatus === 'ACTIVE'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilterStatus('SOLD')}
              className={`pb-3 px-1 font-medium transition-colors ${
                filterStatus === 'SOLD'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sold ({soldCount})
            </button>
          </div>

          {filteredListings.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                {filterStatus === 'ALL' 
                  ? 'No listings yet'
                  : filterStatus === 'ACTIVE'
                  ? 'No active listings'
                  : 'No sold listings'
                }
              </h2>
              <p className="text-gray-500 mb-6">
                {filterStatus === 'ALL'
                  ? 'Create your first listing to start selling on the marketplace'
                  : filterStatus === 'ACTIVE'
                  ? 'You have no active listings at the moment'
                  : 'You have no sold listings yet'
                }
              </p>
              <button
                onClick={() => navigate('/create-listing')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create New Listing
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filteredListings.map(listing => (
                <ProductCard
                  key={listing._id}
                  listing={listing}
                  onClick={handleListingClick}
                  isSaved={savedListingIds.has(listing._id)}
                  onSaveToggle={handleSaveToggle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyListings;
