import React, { memo } from 'react';
import { ChevronDown } from 'lucide-react';
import { ICategory } from '../services/api';

interface FilterMenuProps {
  categories: ICategory[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  minPrice: number;
  maxPrice: number;
  onMinPriceChange: (price: number) => void;
  onMaxPriceChange: (price: number) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
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
  onPageSizeChange
}) => {
  const handleMinPriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, parseInt(e.target.value) || 0);
    if (value <= maxPrice) {
      onMinPriceChange(value);
    }
  };

  const handleMaxPriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, parseInt(e.target.value) || 9999);
    if (value >= minPrice) {
      onMaxPriceChange(value);
    }
  };


  const getSortDisplayName = (sortValue: string) => {
    switch (sortValue) {
      case 'createdAt_desc':
        return 'Newest First';
      case 'createdAt_asc':
        return 'Oldest First';
      case 'price_asc':
        return 'Price: Low to High';
      case 'price_desc':
        return 'Price: High to Low';
      default:
        return 'Newest First';
    }
  };

  return (
    <div className="filter-menu">
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
          <ChevronDown className="select-icon" size={16} />
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
              max="9999"
              value={minPrice}
              onChange={handleMinPriceInput}
              className="price-input"
              placeholder="0"
            />
          </div>
          <div className="price-input-separator">-</div>
          <div className="price-input-group">
            <label className="price-input-label">Max</label>
            <input
              type="number"
              min="0"
              max="9999"
              value={maxPrice}
              onChange={handleMaxPriceInput}
              className="price-input"
              placeholder="9999"
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
          <ChevronDown className="select-icon" size={16} />
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
          <ChevronDown className="select-icon" size={16} />
        </div>
      </div>
    </div>
  );
};

export default memo(FilterMenu);
