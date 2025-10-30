import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Flag, MessageSquare } from 'lucide-react';
import BackButton from '../components/BackButton';
import Navbar from '../components/Navbar';
import { ReportModal } from '../components/ReportModal';
import ReportedDetailsPanel from '../components/ReportedDetailsPanel';
import { useAuth } from '../contexts/AuthContext';
import { apiService, IListing } from '../services/api';

const ViewListing = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<IListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contacting, setContacting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

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
  const mainPhoto = listing.photos && listing.photos.length > 0 
    ? listing.photos.find(p => p.url) || { url: '', alt: listing.title }
    : { url: '', alt: listing.title };

  const categoryName = listing.categoryId && typeof listing.categoryId === 'object' 
    ? listing.categoryId.name 
    : 'Unknown Category';

  const sellerName = listing.userId && typeof listing.userId === 'object' 
    ? listing.userId.name || listing.userId.email || 'Unknown Seller'
    : 'Unknown Seller';

  const sellerEmail = listing.userId && typeof listing.userId === 'object' 
    ? listing.userId.email 
    : '';

  const formattedDate = new Date(listing.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton />

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg overflow-hidden shadow-sm">
            {mainPhoto.url ? (
              <img
                src={mainPhoto.url}
                alt={mainPhoto.alt}
                className="w-full h-[500px] object-cover"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  (e.target as HTMLImageElement).src = '/placeholder-image.svg';
                }}
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

        {/* Admin: Reported Details Panel */}
        {user?.roles?.includes('admin') && listing && (
          <div className="mt-8">
            <ReportedDetailsPanel listingId={listing._id} />
          </div>
        )}
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