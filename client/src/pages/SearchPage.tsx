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

  // Handle sort change
  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
    setCurrentPage(1);
    closeFilterMenu(); // Close mobile filter menu
    // Trigger search and URL update
    setTimeout(() => {
      performSearch(1);
      updateURL({
        q: searchQuery,
        category: selectedCategory,
        minPrice,
        maxPrice,
        sort: sort,
        page: 1,
        pageSize
      });
    }, 0);
  }, [searchQuery, selectedCategory, minPrice, maxPrice, pageSize, performSearch, updateURL]);

  // Handle category change
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    closeFilterMenu(); // Close mobile filter menu
    // Trigger search and URL update
    setTimeout(() => {
      performSearch(1);
      updateURL({
        q: searchQuery,
        category: category,
        minPrice,
        maxPrice,
        sort: sortBy,
        page: 1,
        pageSize
      });
    }, 0);
  }, [searchQuery, minPrice, maxPrice, sortBy, pageSize, performSearch, updateURL]);

  // Handle price range changes
  const handleMinPriceChange = useCallback((price: number | null) => {
    setMinPrice(price);
    setCurrentPage(1);
    // Trigger search and URL update
    setTimeout(() => {
      performSearch(1);
      updateURL({
        q: searchQuery,
        category: selectedCategory,
        minPrice: price,
        maxPrice,
        sort: sortBy,
        page: 1,
        pageSize
      });
    }, 300); // Debounce price changes
  }, [searchQuery, selectedCategory, maxPrice, sortBy, pageSize, performSearch, updateURL]);

  const handleMaxPriceChange = useCallback((price: number | null) => {
    setMaxPrice(price);
    setCurrentPage(1);
    // Trigger search and URL update
    setTimeout(() => {
      performSearch(1);
      updateURL({
        q: searchQuery,
        category: selectedCategory,
        minPrice,
        maxPrice: price,
        sort: sortBy,
        page: 1,
        pageSize
      });
    }, 300); // Debounce price changes
  }, [searchQuery, selectedCategory, minPrice, sortBy, pageSize, performSearch, updateURL]);

  // Handle product click
  const handleProductClick = (listing: IListing) => {
    console.log('Product clicked:', listing);
    // TODO: Implement product detail view or navigation
  };

  // Handle page size change for testing
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
    closeFilterMenu(); // Close mobile filter menu
    // Trigger search and URL update
    setTimeout(() => {
      performSearch(1);
      updateURL({
        q: searchQuery,
        category: selectedCategory,
        minPrice,
        maxPrice,
        sort: sortBy,
        page: 1,
        pageSize: newPageSize
      });
    }, 0);
  };

  // Handle reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setMinPrice(null);
    setMaxPrice(null);
    setSortBy('createdAt_desc');
    setPageSize(6);
    setCurrentPage(1);
    closeFilterMenu(); // Close mobile filter menu
    
    // Trigger search and URL update
    setTimeout(() => {
      performSearch(1);
      updateURL({
        q: '',
        category: '',
        minPrice: null,
        maxPrice: null,
        sort: 'createdAt_desc',
        page: 1,
        pageSize: 6
      });
    }, 0);
  };

  // Toggle mobile filter menu
  const toggleFilterMenu = () => {
    setIsFilterMenuOpen(!isFilterMenuOpen);
  };

  // Close filter menu (for mobile)
  const closeFilterMenu = () => {
    setIsFilterMenuOpen(false);
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
            <span className="font-medium text-gray-700">Filters</span>
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
          {/* Sidebar - Hidden on mobile, shown on desktop */}
          <aside className={`hidden lg:block w-72 flex-shrink-0 bg-white rounded-xl p-6 h-fit shadow-lg`}>
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
              onReset={handleResetFilters}
            />
          </aside>

          {/* Mobile Filter Menu - Collapsible */}
          {isFilterMenuOpen && (
            <div className="lg:hidden bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={closeFilterMenu}
                  className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
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
                onReset={handleResetFilters}
              />
            </div>
          )}

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
