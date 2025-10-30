import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Heart } from 'lucide-react';
import BackButton from '../components/BackButton';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { apiService, IListing } from '../services/api';

interface SavedListingData {
  savedId: string;
  savedAt: string;
  listing: IListing;
}

const SavedListings = () => {
  const navigate = useNavigate();
  const [savedListings, setSavedListings] = useState<SavedListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedListingIds, setSavedListingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSavedListings();
  }, []);

  const fetchSavedListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getSavedListings();
      setSavedListings(response.savedListings);
      
      // Create a set of saved listing IDs for quick lookup
      const ids = new Set(response.savedListings.map(saved => saved.listing._id));
      setSavedListingIds(ids);
    } catch (err: any) {
      console.error('Failed to fetch saved listings:', err);
      setError('Failed to load saved listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleListingClick = (listing: IListing) => {
    navigate(`/listing/${listing._id}`);
  };

  const handleSaveToggle = (listingId: string, isSaved: boolean) => {
    if (!isSaved) {
      // Remove from saved listings
      setSavedListings(prev => prev.filter(saved => saved.listing._id !== listingId));
      setSavedListingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(listingId);
        return newSet;
      });
    }
  };

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
              onClick={fetchSavedListings}
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
            <h1 className="text-3xl font-bold text-gray-900">Saved Listings</h1>
            <div className="text-gray-600">
              {savedListings.length} {savedListings.length === 1 ? 'item' : 'items'}
            </div>
          </div>

          {savedListings.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                No saved listings yet
              </h2>
              <p className="text-gray-500 mb-6">
                Start saving listings you're interested in to view them here later
              </p>
              <button
                onClick={() => navigate('/search')}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {savedListings.map(saved => (
                <ProductCard
                  key={saved.savedId}
                  listing={saved.listing}
                  onClick={handleListingClick}
                  isSaved={savedListingIds.has(saved.listing._id)}
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

export default SavedListings;



