import React, { memo } from 'react';
import { IListing } from '../services/api';

interface ProductCardProps {
  listing: IListing;
  onClick?: (listing: IListing) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ listing, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(listing);
    }
  };

  const imageUrl = listing.photos && listing.photos.length > 0 
    ? listing.photos[0].url 
    : '/placeholder-image.svg';

  return (
    <div className="product-card" onClick={handleClick}>
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
      </div>
      <div className="product-info">
        <h3 className="product-title">{listing.title}</h3>
        <p className="product-price">${listing.price}</p>
      </div>
    </div>
  );
};

export default memo(ProductCard);
