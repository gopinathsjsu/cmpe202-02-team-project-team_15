import React, { memo, useState, useEffect } from 'react';
import { ICategory } from '../services/api';
import CreateNewListingButton from './CreateNewListingButton';

interface FilterMenuProps {
  categories: ICategory[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  minPrice: number | null;
  maxPrice: number | null;
  onMinPriceChange: (price: number | null) => void;
  onMaxPriceChange: (price: number | null) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  onReset: () => void;
  onCreateListing?: () => void;
}

const FilterMenu: React.FC<FilterMenuProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  sortBy,
  onSortChange,
  pageSize,
  onPageSizeChange,
  onReset,
  onCreateListing
}) => {
  // Local state for price inputs
  const [localMinPrice, setLocalMinPrice] = useState<string>('');
  const [localMaxPrice, setLocalMaxPrice] = useState<string>('');

  // Update local state when props change (e.g., from URL params)
  useEffect(() => {
    setLocalMinPrice(minPrice !== null ? minPrice.toString() : '');
  }, [minPrice]);

  useEffect(() => {
    setLocalMaxPrice(maxPrice !== null ? maxPrice.toString() : '');
  }, [maxPrice]);

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalMinPrice(e.target.value);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalMaxPrice(e.target.value);
  };

  const handleMinPriceBlur = () => {
    const value = localMinPrice.trim();
    if (value === '') {
      onMinPriceChange(null);
    } else {
      const numValue = Math.max(0, parseInt(value) || 0);
      
      // Check if we need to swap with max price
      if (maxPrice !== null && numValue > maxPrice) {
        // Swap: new min becomes the old max, new max becomes the entered value
        onMinPriceChange(maxPrice);
        onMaxPriceChange(numValue);
        // Update local state to reflect the swap
        setLocalMinPrice(maxPrice.toString());
        setLocalMaxPrice(numValue.toString());
      } else {
        onMinPriceChange(numValue);
      }
    }
  };

  const handleMaxPriceBlur = () => {
    const value = localMaxPrice.trim();
    if (value === '') {
      onMaxPriceChange(null);
    } else {
      const numValue = Math.max(0, parseInt(value) || 0);
      
      // Check if we need to swap with min price
      if (minPrice !== null && numValue < minPrice) {
        // Swap: new max becomes the old min, new min becomes the entered value
        onMaxPriceChange(minPrice);
        onMinPriceChange(numValue);
        // Update local state to reflect the swap
        setLocalMaxPrice(minPrice.toString());
        setLocalMinPrice(numValue.toString());
      } else {
        onMaxPriceChange(numValue);
      }
    }
  };

  const handleReset = () => {
    // Clear local state
    setLocalMinPrice('');
    setLocalMaxPrice('');
    // Call parent reset handler
    onReset();
  };



  return (
    <div className="filter-menu">
      {/* Create New Listing Button */}
      {onCreateListing && (
        <div className="filter-section">
          <CreateNewListingButton onClick={onCreateListing} />
        </div>
      )}

      {/* Category Filter */}
      <div className="filter-section">
        <label className="filter-label">Category</label>
        <div className="select-container">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          <span className="select-icon">▼</span>
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="filter-section">
        <label className="filter-label">Price Range</label>
        
        {/* Price Input Boxes */}
        <div className="price-inputs">
          <div className="price-input-group">
            <label className="price-input-label">Min</label>
            <input
              type="number"
              min="0"
              value={localMinPrice}
              onChange={handleMinPriceChange}
              onBlur={handleMinPriceBlur}
              className="price-input"
              placeholder="Min"
            />
          </div>
          <div className="price-input-separator">-</div>
          <div className="price-input-group">
            <label className="price-input-label">Max</label>
            <input
              type="number"
              min="0"
              value={localMaxPrice}
              onChange={handleMaxPriceChange}
              onBlur={handleMaxPriceBlur}
              className="price-input"
              placeholder="Max"
            />
          </div>
        </div>

      </div>

      {/* Sort By Filter */}
      <div className="filter-section">
        <label className="filter-label">Sort By</label>
        <div className="select-container">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="filter-select"
          >
            <option value="createdAt_desc">Newest First</option>
            <option value="createdAt_asc">Oldest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <span className="select-icon">▼</span>
        </div>
      </div>

      {/* Items per Page Filter */}
      <div className="filter-section">
        <label className="filter-label">Items per Page</label>
        <div className="select-container">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="filter-select"
          >
            <option value={6}>6 items</option>
            <option value={12}>12 items</option>
            <option value={24}>24 items</option>
            <option value={48}>48 items</option>
          </select>
          <span className="select-icon">▼</span>
        </div>
      </div>

      {/* Reset Button */}
      <div className="filter-section">
        <button
          onClick={handleReset}
          className="reset-button"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default memo(FilterMenu);
