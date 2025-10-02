import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import FilterMenu from '../components/FilterMenu';
import ProductGrid from '../components/ProductGrid';
import Pagination from '../components/Pagination';
import { apiService, IListing, ICategory, SearchParams } from '../services/api';

const SearchPage: React.FC = () => {
  // URL search params
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [listings, setListings] = useState<IListing[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state - initialize from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(Number(searchParams.get('minPrice')) || 0);
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get('maxPrice')) || 9999);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'createdAt_desc');

  // Pagination state - initialize from URL params
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(Number(searchParams.get('pageSize')) || 6);

  // Refs to store current values without causing re-renders
  const searchParamsRef = useRef({
    searchQuery,
    selectedCategory,
    minPrice,
    maxPrice,
    sortBy,
    pageSize
  });

  // Update ref when values change
  useEffect(() => {
    searchParamsRef.current = {
      searchQuery,
      selectedCategory,
      minPrice,
      maxPrice,
      sortBy,
      pageSize
    };
  }, [searchQuery, selectedCategory, minPrice, maxPrice, sortBy, pageSize]);

  // Update URL parameters when search state changes
  const updateURL = useCallback((params: {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const newSearchParams = new URLSearchParams();
    
    // Only add non-default values to keep URLs clean
    if (params.q && params.q.trim()) {
      newSearchParams.set('q', params.q.trim());
    }
    if (params.category) {
      newSearchParams.set('category', params.category);
    }
    if (params.minPrice && params.minPrice > 0) {
      newSearchParams.set('minPrice', params.minPrice.toString());
    }
    if (params.maxPrice && params.maxPrice < 9999) {
      newSearchParams.set('maxPrice', params.maxPrice.toString());
    }
    if (params.sort && params.sort !== 'createdAt_desc') {
      newSearchParams.set('sort', params.sort);
    }
    if (params.page && params.page > 1) {
      newSearchParams.set('page', params.page.toString());
    }
    if (params.pageSize && params.pageSize !== 6) {
      newSearchParams.set('pageSize', params.pageSize.toString());
    }

    setSearchParams(newSearchParams);
  }, [setSearchParams]);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await apiService.getCategories();
        setCategories(categoriesData);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError('Failed to load categories');
      }
    };

    loadCategories();
  }, []);

  // Search function using ref values to prevent constant re-creation
  const performSearch = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = searchParamsRef.current;
      const searchParams: SearchParams = {
        page,
        pageSize: params.pageSize,
        sort: params.sortBy as any,
      };

      if (params.searchQuery.trim()) {
        searchParams.q = params.searchQuery.trim();
      }

      if (params.selectedCategory) {
        searchParams.category = params.selectedCategory;
      }

      if (params.minPrice > 0) {
        searchParams.minPrice = params.minPrice;
      }

      if (params.maxPrice < 9999) {
        searchParams.maxPrice = params.maxPrice;
      }

      const response = await apiService.searchListings(searchParams);
      
      setListings(response.items);
      setCurrentPage(response.page.current);
      setTotalPages(response.page.totalPages);
      setTotalItems(response.page.total);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to search listings');
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search effect for filter changes (price, category, sort, pageSize)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(1);
      // Update URL when filters change
      updateURL({
        q: searchQuery,
        category: selectedCategory,
        minPrice,
        maxPrice,
        sort: sortBy,
        page: 1, // Reset to page 1 when filters change
        pageSize
      });
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [minPrice, maxPrice, selectedCategory, sortBy, pageSize, performSearch, updateURL, searchQuery]);

  // Immediate search for text queries
  useEffect(() => {
    performSearch(1);
    updateURL({
      q: searchQuery,
      category: selectedCategory,
      minPrice,
      maxPrice,
      sort: sortBy,
      page: 1,
      pageSize
    });
  }, [searchQuery, performSearch, updateURL, selectedCategory, minPrice, maxPrice, sortBy, pageSize]);

  // Load initial listings on mount
  useEffect(() => {
    performSearch(currentPage);
  }, [performSearch, currentPage]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    performSearch(1);
    updateURL({
      q: searchQuery,
      category: selectedCategory,
      minPrice,
      maxPrice,
      sort: sortBy,
      page: 1,
      pageSize
    });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    performSearch(page);
    updateURL({
      q: searchQuery,
      category: selectedCategory,
      minPrice,
      maxPrice,
      sort: sortBy,
      page,
      pageSize
    });
  };

  // Handle sort change
  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
    setCurrentPage(1);
  }, []);

  // Handle category change
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  }, []);

  // Handle price range changes
  const handleMinPriceChange = useCallback((price: number) => {
    setMinPrice(price);
    if (price > maxPrice) {
      setMaxPrice(price);
    }
    setCurrentPage(1);
  }, [maxPrice]);

  const handleMaxPriceChange = useCallback((price: number) => {
    setMaxPrice(price);
    if (price < minPrice) {
      setMinPrice(price);
    }
    setCurrentPage(1);
  }, [minPrice]);

  // Handle product click
  const handleProductClick = (listing: IListing) => {
    console.log('Product clicked:', listing);
    // TODO: Implement product detail view or navigation
  };

  // Handle page size change for testing
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  return (
    <div className="app">
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <FilterMenu
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPriceChange={handleMinPriceChange}
            onMaxPriceChange={handleMaxPriceChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
        </aside>

        {/* Main content */}
        <main className="main-content">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
          />

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="results-info">
            {!loading && (
              <p>{totalItems} products found</p>
            )}
          </div>

          <ProductGrid
            listings={listings}
            loading={loading}
            onProductClick={handleProductClick}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </main>
      </div>
    </div>
  );
};

export default SearchPage;
