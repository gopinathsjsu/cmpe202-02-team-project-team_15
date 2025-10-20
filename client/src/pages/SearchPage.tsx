import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import FilterMenu from '../components/FilterMenu';
import ProductGrid from '../components/ProductGrid';
import Pagination from '../components/Pagination';
import { apiService, IListing, ICategory, SearchParams } from '../services/api';

const SearchPage: React.FC = () => {
  // URL search params
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State management
  const [listings, setListings] = useState<IListing[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state - initialize from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState<number | null>(() => {
    const minPriceParam = searchParams.get('minPrice');
    return minPriceParam ? Number(minPriceParam) : null;
  });
  const [maxPrice, setMaxPrice] = useState<number | null>(() => {
    const maxPriceParam = searchParams.get('maxPrice');
    return maxPriceParam ? Number(maxPriceParam) : null;
  });
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'createdAt_desc');

  // Pagination state - initialize from URL params
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(Number(searchParams.get('pageSize')) || 6);

  // Mobile filter menu state
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

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
    minPrice?: number | null;
    maxPrice?: number | null;
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
    if (params.minPrice !== null && params.minPrice !== undefined && params.minPrice > 0) {
      newSearchParams.set('minPrice', params.minPrice.toString());
    }
    if (params.maxPrice !== null && params.maxPrice !== undefined) {
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
  const performSearch = useCallback(async (page: number = 1, updateCurrentPage: boolean = true, query?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = searchParamsRef.current;
      const searchParams: SearchParams = {
        page,
        pageSize: params.pageSize,
        sort: params.sortBy as any,
      };

      const searchQueryToUse = query !== undefined ? query : params.searchQuery;
      if (searchQueryToUse.trim()) {
        searchParams.q = searchQueryToUse.trim();
      }

      if (params.selectedCategory) {
        searchParams.category = params.selectedCategory;
      }

      if (params.minPrice !== null && params.minPrice !== undefined && params.minPrice > 0) {
        searchParams.minPrice = params.minPrice;
      }

      if (params.maxPrice !== null && params.maxPrice !== undefined) {
        searchParams.maxPrice = params.maxPrice;
      }

      const response = await apiService.searchListings(searchParams);
      
      setListings(response.items);
      // Only update current page if explicitly requested (for page navigation)
      if (updateCurrentPage) {
        setCurrentPage(response.page.current);
      }
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

  // Load initial listings on mount
  useEffect(() => {
    performSearch(currentPage);
  }, [performSearch, currentPage]);

  // Handle search query change
  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = (query?: string) => {
    const searchQueryToUse = query !== undefined ? query : searchQuery;
    setCurrentPage(1);
    performSearch(1, true, searchQueryToUse);
    updateURL({
      q: searchQueryToUse,
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
    performSearch(page, false); // Don't update current page from server response
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

  // Toggle mobile filter menu
  const toggleFilterMenu = () => {
    setIsFilterMenuOpen(!isFilterMenuOpen);
  };

  // Close filter menu (for mobile)
  const closeFilterMenu = () => {
    setIsFilterMenuOpen(false);
  };

  // Utility function to handle filter changes with common pattern
  const handleFilterChange = useCallback((
    updates: {
      searchQuery?: string;
      selectedCategory?: string;
      minPrice?: number | null;
      maxPrice?: number | null;
      sortBy?: string;
      pageSize?: number;
    },
    debounceMs: number = 0
  ) => {
    // Update state
    if (updates.searchQuery !== undefined) setSearchQuery(updates.searchQuery);
    if (updates.selectedCategory !== undefined) setSelectedCategory(updates.selectedCategory);
    if (updates.minPrice !== undefined) setMinPrice(updates.minPrice);
    if (updates.maxPrice !== undefined) setMaxPrice(updates.maxPrice);
    if (updates.sortBy !== undefined) setSortBy(updates.sortBy);
    if (updates.pageSize !== undefined) setPageSize(updates.pageSize);
    
    setCurrentPage(1);
    closeFilterMenu();
    
    // Trigger search and URL update
    setTimeout(() => {
      performSearch(1);
      updateURL({
        q: updates.searchQuery !== undefined ? updates.searchQuery : searchQuery,
        category: updates.selectedCategory !== undefined ? updates.selectedCategory : selectedCategory,
        minPrice: updates.minPrice !== undefined ? updates.minPrice : minPrice,
        maxPrice: updates.maxPrice !== undefined ? updates.maxPrice : maxPrice,
        sort: updates.sortBy !== undefined ? updates.sortBy : sortBy,
        page: 1,
        pageSize: updates.pageSize !== undefined ? updates.pageSize : pageSize
      });
    }, debounceMs);
  }, [searchQuery, selectedCategory, minPrice, maxPrice, sortBy, pageSize, performSearch, updateURL]);

  // Handle sort change
  const handleSortChange = useCallback((sort: string) => {
    handleFilterChange({ sortBy: sort });
  }, [handleFilterChange]);

  // Handle category change
  const handleCategoryChange = useCallback((category: string) => {
    handleFilterChange({ selectedCategory: category });
  }, [handleFilterChange]);

  // Handle price range changes
  const handleMinPriceChange = useCallback((price: number | null) => {
    handleFilterChange({ minPrice: price }, 300); // Debounce price changes
  }, [handleFilterChange]);

  const handleMaxPriceChange = useCallback((price: number | null) => {
    handleFilterChange({ maxPrice: price }, 300); // Debounce price changes
  }, [handleFilterChange]);

  // Handle product click
  const handleProductClick = (listing: IListing) => {
    console.log('Product clicked:', listing);
    // TODO: Implement product detail view or navigation
  };

  // Handle page size change for testing
  const handlePageSizeChange = (newPageSize: number) => {
    handleFilterChange({ pageSize: newPageSize });
  };

  // Handle reset all filters
  const handleResetFilters = () => {
    handleFilterChange({
      searchQuery: '',
      selectedCategory: '',
      minPrice: null,
      maxPrice: null,
      sortBy: 'createdAt_desc',
      pageSize: 6
    });
  };

  // FilterMenu props object to avoid duplication
  const filterMenuProps = {
    categories,
    selectedCategory,
    onCategoryChange: handleCategoryChange,
    minPrice,
    maxPrice,
    onMinPriceChange: handleMinPriceChange,
    onMaxPriceChange: handleMaxPriceChange,
    sortBy,
    onSortChange: handleSortChange,
    pageSize,
    onPageSizeChange: handlePageSizeChange,
    onReset: handleResetFilters,
    // TODO: change null to the create listing page path like '/create-listing'
    onCreateListing: () => null
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-5">
        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={toggleFilterMenu}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className="font-medium text-gray-700">Menu</span>
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${isFilterMenuOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Filter Menu - Single Component with Conditional Styling */}
          <div className={`${isFilterMenuOpen ? 'block lg:hidden' : 'hidden lg:block'} w-full lg:w-72 flex-shrink-0 bg-white rounded-xl p-6 h-fit shadow-lg`}>
            {/* Mobile Header - Only shown on mobile when menu is open */}
            {isFilterMenuOpen && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Menu</h3>
                <button
                  onClick={closeFilterMenu}
                  className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <FilterMenu {...filterMenuProps} />
          </div>

          {/* Main content */}
          <main className="flex-1 flex flex-col gap-5">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={handleSearchQueryChange}
              onSearch={handleSearch}
            />

            {error && (
              <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div className="text-gray-600 text-sm">
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
    </div>
  );
};

export default SearchPage;
