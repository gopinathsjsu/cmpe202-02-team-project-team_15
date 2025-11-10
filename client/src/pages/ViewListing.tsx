import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  MessageSquare,
  Flag,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Eye,
  Edit,
  UserCog,
  X,
  Heart
} from "lucide-react";
import Navbar from '../components/Navbar';
import { ReportModal } from "../components/ReportModal";
import { WarnUserModal } from "../components/WarnUserModal";
import ReportedDetailsPanel from "../components/ReportedDetailsPanel";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { apiService, IListing, ICategory } from "../services/api";
import api from "../services/api";

const ViewListing = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showLoading, showSuccess, showError, hideToast } = useToast();
  const [listing, setListing] = useState<IListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contacting, setContacting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [updatingCategory, setUpdatingCategory] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) {
        setError("Listing ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const fetchedListing = await apiService.getListingById(id);
        setListing(fetchedListing);
      } catch (err) {
        console.error("Failed to fetch listing:", err);
        setError("Failed to fetch listing. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await apiService.getCategories();
        setCategories(categoriesData);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };

    if (user?.roles?.includes('admin')) {
      fetchCategories();
    }
  }, [user]);

  useEffect(() => {
    const checkIfSaved = async () => {
      if (!id || !user) return;
      
      try {
        const response = await apiService.getSavedListingIds();
        setIsSaved(response.listingIds.includes(id));
      } catch (err) {
        console.error('Failed to check if listing is saved:', err);
      }
    };

    checkIfSaved();
  }, [id, user]);

  const handleContactSeller = async () => {
    if (!listing) return;

    try {
      setContacting(true);
      const response = await apiService.initiateChat(listing._id);

      // Navigate to messages with the conversation ID
      navigate(`/messages?conversationId=${response.conversation._id}`);
    } catch (err: any) {
      console.error("Error initiating chat:", err);
      // Check if it's a 400 error (conversation already exists)
      if (err.response?.status === 400) {
        // Try to get existing conversations and find the one for this listing
        try {
          const conversationsResponse = await apiService.getConversations();
          const existingConv = conversationsResponse.conversations.find(
            (conv) => conv.listingId === listing._id
          );
          if (existingConv) {
            navigate(`/messages?conversationId=${existingConv._id}`);
            return;
          }
        } catch (convErr) {
          console.error("Error fetching conversations:", convErr);
        }
      }
      showError(
        "Failed to Start Conversation",
        "Unable to contact the seller. Please try again later."
      );
    } finally {
      setContacting(false);
    }
  };

  const handleReportSubmitted = () => {
    // Report submitted successfully
  };

  const handleDelete = async () => {
    if (!listing || !id) return;

    const loadingToastId = showLoading(
      "Deleting Listing",
      "Please wait while we delete the listing..."
    );

    try {
      setDeleting(true);
      await apiService.deleteListing(id);
      
      // Hide loading and show success
      hideToast(loadingToastId);
      showSuccess(
        "Listing Deleted Successfully!",
        "The listing has been removed from the marketplace."
      );
      
      // Navigate to search page after successful deletion
      setTimeout(() => navigate('/search'), 1000);
    } catch (err: any) {
      console.error('Error deleting listing:', err);
      
      // Hide loading and show error
      hideToast(loadingToastId);
      showError(
        "Failed to Delete Listing",
        err.response?.data?.error || 'Please try again later.'
      );
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleOpenEditCategory = () => {
    // Set the current category as selected
    if (listing?.categoryId && typeof listing.categoryId === 'object') {
      setSelectedCategoryId(listing.categoryId._id);
    }
    setShowEditCategoryModal(true);
  };

  const handleUpdateCategory = async () => {
    if (!listing || !selectedCategoryId) return;

    const loadingToastId = showLoading(
      "Updating Category",
      "Please wait while we update the listing category..."
    );

    try {
      setUpdatingCategory(true);
      const response = await api.put(`/api/admin/listings/${listing._id}/category`, {
        categoryId: selectedCategoryId
      });

      // Update the listing in state with the new category
      setListing(response.data.data.listing);
      setShowEditCategoryModal(false);
      
      // Hide loading and show success
      hideToast(loadingToastId);
      showSuccess(
        "Category Updated Successfully!",
        "The listing category has been changed."
      );
    } catch (err: any) {
      console.error('Error updating category:', err);
      
      // Hide loading and show error
      hideToast(loadingToastId);
      showError(
        "Failed to Update Category",
        err.response?.data?.message || 'Please try again later.'
      );
    } finally {
      setUpdatingCategory(false);
    }
  };

  const handleSaveToggle = async () => {
    if (isSaving || !id) return;

    try {
      setIsSaving(true);

      if (isSaved) {
        await apiService.unsaveListing(id);
        setIsSaved(false);
      } else {
        await apiService.saveListing(id);
        setIsSaved(true);
      }
    } catch (error: any) {
      console.error('Error toggling save:', error);
      // If already saved error, just update the state
      if (error.response?.status === 400 && error.response?.data?.error?.includes('already saved')) {
        setIsSaved(true);
      } else {
        showError(
          "Failed to Save Listing",
          error.response?.data?.error || 'Please try again later.'
        );
      }
    } finally {
      setIsSaving(false);
    }
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
            onClick={() => navigate("/search")}
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
            onClick={() => navigate("/search")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  // Safely access nested properties with fallbacks
  const categoryName =
    listing.categoryId && typeof listing.categoryId === "object"
      ? listing.categoryId.name
      : "Unknown Category";

  const sellerName =
    listing.userId && typeof listing.userId === "object"
      ? `${listing.userId.first_name || ""} ${
          listing.userId.last_name || ""
        }`.trim() ||
        listing.userId.email ||
        "Unknown Seller"
      : "Unknown Seller";

  const sellerEmail =
    listing.userId && typeof listing.userId === "object"
      ? listing.userId.email
      : "";

  const formattedDate = new Date(listing.createdAt).toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );

  // Check if current user owns this listing
  // Handle both populated (object) and non-populated (string) userId formats
  let listingUserId: string | null = null;
  if (listing.userId) {
    if (typeof listing.userId === 'object') {
      // When populated, userId can be an object with _id or id field
      listingUserId = listing.userId._id || (listing.userId as any).id || null;
    } else {
      // When not populated, userId is a string
      listingUserId = listing.userId;
    }
  }
  
  const isOwner = user && listingUserId && String(listingUserId) === String(user.id);

  // Get all valid photos
  const validPhotos = listing.photos?.filter((p) => p.url) || [];
  const hasMultipleImages = validPhotos.length > 1;

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? validPhotos.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === validPhotos.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Image Container - Consistent Height */}
          <div className="flex-1 h-[400px] sm:h-[500px] lg:h-[650px] bg-white rounded-xl overflow-hidden shadow-md relative p-6">
            {validPhotos.length > 0 ? (
              <>
                <img
                  src={validPhotos[currentImageIndex].url}
                  alt={validPhotos[currentImageIndex].alt || listing.title}
                  className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setShowImageModal(true)}
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    (e.target as HTMLImageElement).src =
                      "/placeholder-image.svg";
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
                {/* Heart button - only for non-owners */}
                {!isOwner && (
                  <button
                    onClick={handleSaveToggle}
                    disabled={isSaving}
                    className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all hover:scale-110 disabled:opacity-50 z-20"
                    aria-label={isSaved ? 'Unsave listing' : 'Save listing'}
                    title={isSaved ? 'Remove from saved' : 'Save for later'}
                  >
                    <Heart
                      className={`w-6 h-6 transition-colors ${
                        isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'
                      }`}
                    />
                  </button>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 text-lg">No image available</span>
              </div>
            )}
          </div>

          {/* Description Container - Matching Height */}
          <div className="flex-1 h-[400px] sm:h-[500px] lg:h-[650px] bg-white rounded-xl shadow-md overflow-y-auto p-6">
            <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {listing.title}
              </h1>
              <div className="inline-block px-3 py-1 bg-gray-100 rounded-md text-sm text-gray-700 mb-4">
                {categoryName}
              </div>
              <div className="text-4xl font-bold text-gray-900">
                ${listing.price}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Description
              </h2>
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
                <div className="text-lg font-semibold text-gray-900">
                  {sellerName}
                </div>
                {sellerEmail && (
                  <div className="text-sm text-gray-500">{sellerEmail}</div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {isOwner ? (
                <>
                  <button 
                    onClick={() => navigate(`/listing/${id}/edit`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Edit Listing</span>
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleting}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>{deleting ? 'Deleting...' : 'Delete Listing'}</span>
                  </button>
                </>
              ) : listing.status === 'SOLD' ? (
                <>
                  <div className="w-full bg-gray-100 text-gray-800 font-bold py-3 px-4 rounded-lg border-2 border-gray-300 flex items-center justify-center cursor-not-allowed">
                    <span className="text-xl">SOLD</span>
                  </div>
                  <button 
                    onClick={() => setShowReportModal(true)}
                    className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Flag className="w-5 h-5" />
                    <span>Report</span>
                  </button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Admin: Actions and Reported Details Panel */}
        {user?.roles?.includes("admin") && listing && !isOwner && (
          <div className="mt-8 space-y-6">
            {/* Admin Actions Section - Horizontal Layout */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                Admin Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <button
                  onClick={() => setShowWarnModal(true)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span>Warn User</span>
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement delete listing functionality
                    alert("Delete listing functionality coming soon");
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Delete Listing</span>
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement hide/show listing functionality
                    alert("Hide/Show listing functionality coming soon");
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Eye className="w-5 h-5" />
                  <span>Hide/Show Listing</span>
                </button>
                <button
                  onClick={handleOpenEditCategory}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Edit className="w-5 h-5" />
                  <span>Edit Categories</span>
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement manage user account functionality
                    alert("Manage user account functionality coming soon");
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <UserCog className="w-5 h-5" />
                  <span>Manage User Account</span>
                </button>
              </div>
            </div>

            {/* Reported Details Panel */}
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

      {/* Warn User Modal */}
      {listing && (
        <WarnUserModal
          isOpen={showWarnModal}
          onClose={() => setShowWarnModal(false)}
          listingId={listing._id}
          listingTitle={listing.title}
          onWarningSent={() => {
            // Warning sent successfully
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Listing</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this listing? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Category</h2>
              <button onClick={() => setShowEditCategoryModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Change the category for "{listing?.title}"
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Category
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleUpdateCategory}
                disabled={updatingCategory || !selectedCategoryId}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {updatingCategory ? 'Updating...' : 'Update Category'}
              </button>
              <button
                type="button"
                onClick={() => setShowEditCategoryModal(false)}
                disabled={updatingCategory}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal - Fullscreen View */}
      {showImageModal && validPhotos.length > 0 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          {/* Image container with controls - Fixed consistent size */}
          <div className="relative w-[90vw] h-[85vh] flex items-center justify-center">
            {/* Full size image */}
            <img
              src={validPhotos[currentImageIndex].url}
              alt={validPhotos[currentImageIndex].alt || listing.title}
              className="w-full h-full object-contain"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-image.svg";
              }}
            />

            {/* Close button - On top right of image */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full transition-colors shadow-lg"
              aria-label="Close image"
            >
              <X className="w-6 h-6 text-gray-900" />
            </button>

            {/* Navigation arrows - On the image */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviousImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 rounded-full p-3 transition-all shadow-lg"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 rounded-full p-3 transition-all shadow-lg"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                
                {/* Image counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 text-gray-900 px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                  {currentImageIndex + 1} / {validPhotos.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewListing;
