import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MessageSquare, Flag, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import BackButton from '../components/BackButton';
import { ReportModal } from '../components/ReportModal';
import { apiService, IListing } from '../services/api';
// import { useAuth } from '../contexts/AuthContext'; // Removed since we're not using it

const ViewListing = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // const { user } = useAuth(); // Removed since we're not using it in this component
  const [listing, setListing] = useState<IListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contacting, setContacting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const handleContactSeller = async () => {
    if (!listing) return;
    
    try {
      setContacting(true);
      const response = await apiService.initiateChat(listing._id);
      
      // Navigate to messages with the conversation ID
      navigate(`/messages?conversationId=${response.conversation._id}`);
    } catch (err: any) {
      console.error('Error initiating chat:', err);
      // Check if it's a 400 error (conversation already exists)
      if (err.response?.status === 400) {
        // Try to get existing conversations and find the one for this listing
        try {
          const conversationsResponse = await apiService.getConversations();
          const existingConv = conversationsResponse.conversations.find(
            conv => conv.listingId === listing._id
          );
          if (existingConv) {
            navigate(`/messages?conversationId=${existingConv._id}`);
            return;
          }
        } catch (convErr) {
          console.error('Error fetching conversations:', convErr);
        }
      }
      // You could show a toast notification here
      alert('Failed to start conversation. Please try again.');
    } finally {
      setContacting(false);
    }
  };

  const handleReportSubmitted = () => {
    // You could show a success message here
    console.log('Report submitted successfully');
  };

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

  // Safely access nested properties with fallbacks
  const categoryName = listing.categoryId && typeof listing.categoryId === 'object' 
    ? listing.categoryId.name 
    : 'Unknown Category';

  const sellerName = listing.userId && typeof listing.userId === 'object' 
    ? `${listing.userId.first_name || ''} ${listing.userId.last_name || ''}`.trim() || listing.userId.email || 'Unknown Seller'
    : 'Unknown Seller';
  
  const sellerEmail = listing.userId && typeof listing.userId === 'object' 
    ? listing.userId.email 
    : '';

  const formattedDate = new Date(listing.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Get all valid photos
  const validPhotos = listing.photos?.filter(p => p.url) || [];
  const hasMultipleImages = validPhotos.length > 1;

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? validPhotos.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === validPhotos.length - 1 ? 0 : prev + 1));
  };

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
              <button 
                onClick={() => navigate('/search')}
                className="text-gray-700 hover:text-gray-900"
              >
                Marketplace
              </button>
              <button 
                onClick={() => navigate('/messages')}
                className="text-gray-700 hover:text-gray-900 flex items-center space-x-1"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Messages</span>
              </button>
              <button 
                onClick={() => navigate('/saved')}
                className="text-gray-700 hover:text-gray-900 flex items-center space-x-1"
              >
                <Heart className="w-5 h-5" />
                <span>Saved</span>
              </button>
              <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-700 text-sm font-medium">A</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton />

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg overflow-hidden shadow-sm relative">
            {validPhotos.length > 0 ? (
              <>
                <img
                  src={validPhotos[currentImageIndex].url}
                  alt={validPhotos[currentImageIndex].alt || listing.title}
                  className="w-full h-[500px] object-contain bg-gray-50"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    (e.target as HTMLImageElement).src = '/placeholder-image.svg';
                  }}
                />
                {/* Navigation arrows for multiple images */}
                {hasMultipleImages && (
                  <>
                    {/* Forward arrow - show for all images */}
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-10"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    {/* Back arrow - show for all images */}
                    <button
                      onClick={handlePreviousImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-10"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    {/* Image counter */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {validPhotos.length}
                    </div>
                  </>
                )}
              </>
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
                {categoryName}
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
                <div className="text-lg font-semibold text-gray-900">{sellerName}</div>
                {sellerEmail && (
                  <div className="text-sm text-gray-500">{sellerEmail}</div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleContactSeller}
                disabled={contacting}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <MessageSquare className="w-5 h-5" />
                <span>{contacting ? 'Starting conversation...' : 'Contact Seller'}</span>
              </button>
              <button 
                onClick={() => setShowReportModal(true)}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 transition-colors flex items-center justify-center space-x-2"
              >
                <Flag className="w-5 h-5" />
                <span>Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {listing && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          listingId={listing._id}
          listingTitle={listing.title}
          onReportSubmitted={handleReportSubmitted}
        />
      )}
    </div>
  );
};

export default ViewListing;