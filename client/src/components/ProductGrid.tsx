import React, { memo } from 'react';
import ProductCard from './ProductCard';
import { IListing } from '../services/api';

interface ProductGridProps {
  listings: IListing[];
  loading?: boolean;
  onProductClick?: (listing: IListing) => void;
  savedListingIds?: Set<string>;
  onSaveToggle?: (listingId: string, isSaved: boolean) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ 
  listings, 
  loading = false, 
  onProductClick,
  savedListingIds = new Set(),
  onSaveToggle
}) => {
  if (loading) {
    return (
      <div className="product-grid loading">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="product-card skeleton">
            <div className="product-image-container skeleton-image"></div>
            <div className="product-info">
              <div className="skeleton-text skeleton-title"></div>
              <div className="skeleton-text skeleton-price"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="no-results">
        <p>No products found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {listings.map((listing) => (
        <ProductCard
          key={listing._id}
          listing={listing}
          onClick={onProductClick}
          isSaved={savedListingIds.has(listing._id)}
          onSaveToggle={onSaveToggle}
        />
      ))}
    </div>
  );
};

export default memo(ProductGrid);
