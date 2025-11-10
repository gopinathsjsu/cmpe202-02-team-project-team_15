import React, { memo, useState } from 'react';
import { Heart } from 'lucide-react';
import { IListing, apiService } from '../services/api';

interface ProductCardProps {
  listing: IListing;
  onClick?: (listing: IListing) => void;
  isSaved?: boolean;
  onSaveToggle?: (listingId: string, isSaved: boolean) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  listing, 
  onClick, 
  isSaved: initialIsSaved = false,
  onSaveToggle 
}) => {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isSaving, setIsSaving] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick(listing);
    }
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      
      if (isSaved) {
        await apiService.unsaveListing(listing._id);
        setIsSaved(false);
        if (onSaveToggle) {
          onSaveToggle(listing._id, false);
        }
      } else {
        await apiService.saveListing(listing._id);
        setIsSaved(true);
        if (onSaveToggle) {
          onSaveToggle(listing._id, true);
        }
      }
    } catch (error: any) {
      console.error('Error toggling save:', error);
      // If already saved error, just update the state
      if (error.response?.status === 400 && error.response?.data?.error?.includes('already saved')) {
        setIsSaved(true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const imageUrl = listing.photos && listing.photos.length > 0 
    ? listing.photos[0].url 
    : '/placeholder-image.svg';

  const isSold = listing.status === 'SOLD';

  return (
    <div 
      className={`product-card ${isSold ? 'opacity-60' : ''}`} 
      onClick={handleClick}
    >
      <div className="product-image-container">
        <img
          src={imageUrl}
          alt={listing.title}
          className="product-image"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            (e.target as HTMLImageElement).src = '/placeholder-image.svg';
          }}
        />
        {isSold && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-lg">
              SOLD
            </span>
          </div>
        )}
        <button
          onClick={handleSaveClick}
          disabled={isSaving}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all hover:scale-110 disabled:opacity-50 z-10"
          aria-label={isSaved ? 'Unsave listing' : 'Save listing'}
          title={isSaved ? 'Remove from saved' : 'Save for later'}
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }`}
          />
        </button>
      </div>
      <div className="product-info">
        <h3 className="product-title">{listing.title}</h3>
        <p className="product-price">${listing.price}</p>
      </div>
    </div>
  );
};

export default memo(ProductCard);
