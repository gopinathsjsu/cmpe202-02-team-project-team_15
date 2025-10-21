import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MessageSquare, Flag } from 'lucide-react';
import BackButton from '../components/BackButton';
import { apiService, IListing } from '../services/api';

const ViewListing = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<IListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) {
        setError('Listing ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const fetchedListing = await apiService.getListingById(id);
        setListing(fetchedListing);
      } catch (err) {
        console.error('Failed to fetch listing:', err);
        setError('Failed to fetch listing. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={() => navigate('/search')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">Listing not found</div>
          <button 
            onClick={() => navigate('/search')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const mainPhoto = listing.photos.find(p => p.url) || { url: '', alt: listing.title };
  const formattedDate = new Date(listing.createdAt).toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CM</span>
                </div>
                <span className="font-semibold text-gray-900">Campus Market</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-gray-700 hover:text-gray-900">Marketplace</a>
              <a href="#" className="text-gray-700 hover:text-gray-900 flex items-center space-x-1">
                <MessageSquare className="w-5 h-5" />
                <span>Messages</span>
              </a>
              <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-700 text-sm font-medium">A</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton onBack={onBack} />

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg overflow-hidden shadow-sm">
            {mainPhoto.url ? (
              <img
                src={mainPhoto.url}
                alt={mainPhoto.alt}
                className="w-full h-[500px] object-cover"
              />
            ) : (
              <div className="w-full h-[500px] bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
              <div className="inline-block px-3 py-1 bg-gray-100 rounded-md text-sm text-gray-700 mb-4">
                {listing.category.name}
              </div>
              <div className="text-4xl font-bold text-gray-900">${listing.price}</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 text-gray-600 mb-4">
                <Calendar className="w-5 h-5" />
                <span className="text-sm">Posted on {formattedDate}</span>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Seller</div>
                <div className="text-lg font-semibold text-gray-900">{listing.user.full_name}</div>
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Contact Seller</span>
              </button>
              <button className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 transition-colors flex items-center justify-center space-x-2">
                <Flag className="w-5 h-5" />
                <span>Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewListing;
