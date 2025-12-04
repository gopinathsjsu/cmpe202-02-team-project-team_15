import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Pagination from '../components/Pagination';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiService } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const REPORT_CATEGORIES = [
  { label: 'Fraud', value: 'FRAUD' },
  { label: 'Scam / Counterfeit', value: 'SCAM_COUNTERFEIT' },
  { label: 'Misleading info / Wrong Category', value: 'MISLEADING_WRONG_CATEGORY' },
  { label: 'Inappropriate/Prohibited/Safety Concern', value: 'INAPPROPRIATE_PROHIBITED_SAFETY' },
  { label: 'Other', value: 'OTHER' },
];

const REPORT_STATUSES = [
  { label: 'Open', value: 'OPEN' },
  { label: 'In Review', value: 'IN_REVIEW' },
  { label: 'Closed', value: 'CLOSED' },
];

const AdminReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('to') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filterByListingId, setFilterByListingId] = useState(searchParams.get('listingId') || '');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(Number(searchParams.get('pageSize')) || 12);

  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  // Refs for values
  const searchParamsRef = useRef({
    selectedStatus,
    selectedCategory,
    dateFrom,
    dateTo,
    searchQuery,
    pageSize,
    filterByListingId
  });

  useEffect(() => {
    searchParamsRef.current = {
      selectedStatus,
      selectedCategory,
      dateFrom,
      dateTo,
      searchQuery,
      pageSize,
      filterByListingId
    };
  }, [selectedStatus, selectedCategory, dateFrom, dateTo, searchQuery, pageSize, filterByListingId]);

  // Update URL parameters
  const updateURL = useCallback((params: {
    status?: string;
    category?: string;
    from?: string;
    to?: string;
    q?: string;
    page?: number;
    pageSize?: number;
    listingId?: string;
  }) => {
    const newSearchParams = new URLSearchParams();
    
    if (params.status) newSearchParams.set('status', params.status);
    if (params.category) newSearchParams.set('category', params.category);
    if (params.from) newSearchParams.set('from', params.from);
    if (params.to) newSearchParams.set('to', params.to);
    if (params.q && params.q.trim()) newSearchParams.set('q', params.q.trim());
    if (params.page && params.page > 1) newSearchParams.set('page', params.page.toString());
    if (params.pageSize && params.pageSize !== 12) newSearchParams.set('pageSize', params.pageSize.toString());
    if (params.listingId) newSearchParams.set('listingId', params.listingId);

    setSearchParams(newSearchParams);
  }, [setSearchParams]);

  // Fetch reports
  const performSearch = useCallback(async (page: number = 1) => {
    setLoading(true);

    try {
      const params = searchParamsRef.current;
      const queryParams: any = {
        page,
        pageSize: params.pageSize,
      };

      if (params.selectedStatus) queryParams.status = params.selectedStatus;
      if (params.selectedCategory) queryParams.category = params.selectedCategory;
      if (params.dateFrom) queryParams.from = params.dateFrom;
      if (params.dateTo) queryParams.to = params.dateTo;
      if (params.searchQuery.trim()) queryParams.q = params.searchQuery.trim();
      if (params.filterByListingId) queryParams.listingId = params.filterByListingId;

      const data = await apiService.getAdminReports(queryParams);
      
      setReports(data?.reports || []);
      setCurrentPage(data?.pagination?.current_page || 1);
      setTotalPages(data?.pagination?.total_pages || 1);
      setTotalItems(data?.pagination?.total_reports || 0);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      showError('Load Failed', err.response?.data?.message || 'Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Load reports on mount and filter change
  useEffect(() => {
    performSearch(currentPage);
  }, [performSearch, currentPage]);

  // Filter change handlers
  const handleFilterChange = useCallback((updates: {
    selectedStatus?: string;
    selectedCategory?: string;
    dateFrom?: string;
    dateTo?: string;
    searchQuery?: string;
    pageSize?: number;
    filterByListingId?: string;
  }) => {
    if (updates.selectedStatus !== undefined) setSelectedStatus(updates.selectedStatus);
    if (updates.selectedCategory !== undefined) setSelectedCategory(updates.selectedCategory);
    if (updates.dateFrom !== undefined) setDateFrom(updates.dateFrom);
    if (updates.dateTo !== undefined) setDateTo(updates.dateTo);
    if (updates.searchQuery !== undefined) setSearchQuery(updates.searchQuery);
    if (updates.pageSize !== undefined) setPageSize(updates.pageSize);
    if (updates.filterByListingId !== undefined) setFilterByListingId(updates.filterByListingId);
    
    setCurrentPage(1);
    setIsFilterMenuOpen(false);
    
    setTimeout(() => {
      performSearch(1);
      updateURL({
        status: updates.selectedStatus !== undefined ? updates.selectedStatus : selectedStatus,
        category: updates.selectedCategory !== undefined ? updates.selectedCategory : selectedCategory,
        from: updates.dateFrom !== undefined ? updates.dateFrom : dateFrom,
        to: updates.dateTo !== undefined ? updates.dateTo : dateTo,
        q: updates.searchQuery !== undefined ? updates.searchQuery : searchQuery,
        page: 1,
        pageSize: updates.pageSize !== undefined ? updates.pageSize : pageSize,
        listingId: updates.filterByListingId !== undefined ? updates.filterByListingId : filterByListingId
      });
    }, 0);
  }, [selectedStatus, selectedCategory, dateFrom, dateTo, searchQuery, pageSize, filterByListingId, performSearch, updateURL]);

  const handleStatusChange = useCallback((status: string) => {
    handleFilterChange({ selectedStatus: status });
  }, [handleFilterChange]);

  const handleCategoryChange = useCallback((category: string) => {
    handleFilterChange({ selectedCategory: category });
  }, [handleFilterChange]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    performSearch(page);
    updateURL({
      status: selectedStatus,
      category: selectedCategory,
      from: dateFrom,
      to: dateTo,
      q: searchQuery,
      page,
      pageSize
    });
  };

  const handleResetFilters = () => {
    handleFilterChange({
      selectedStatus: '',
      selectedCategory: '',
      dateFrom: '',
      dateTo: '',
      searchQuery: '',
      pageSize: 12,
      filterByListingId: ''
    });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    handleFilterChange({ pageSize: newPageSize });
  };

  const toggleFilterMenu = () => {
    setIsFilterMenuOpen(!isFilterMenuOpen);
  };

  const closeFilterMenu = () => {
    setIsFilterMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Report Management</h1>
              <p className="text-gray-600 mt-1">Review and manage user reports</p>
            </div>
          </div>

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
          {/* Filter Menu Sidebar */}
          <div className={`${isFilterMenuOpen ? 'block lg:hidden' : 'hidden lg:block'} w-full lg:w-72 flex-shrink-0 bg-white rounded-xl p-6 h-fit shadow-lg`}>
            {/* Mobile Header */}
            {isFilterMenuOpen && (
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
            )}
            <div className="filter-menu">
              {/* Status Filter */}
              <div className="filter-section">
                <label className="filter-label">Status</label>
                <div className="select-container">
                  <select
                    value={selectedStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Statuses</option>
                    {REPORT_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <span className="select-icon">▼</span>
                </div>
              </div>

              {/* Category Filter */}
              <div className="filter-section">
                <label className="filter-label">Category</label>
                <div className="select-container">
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Categories</option>
                    {REPORT_CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <span className="select-icon">▼</span>
                </div>
              </div>

              {/* Date Range */}
              <div className="filter-section">
                <label className="filter-label">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
                  className="filter-select"
                />
              </div>

              <div className="filter-section">
                <label className="filter-label">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => handleFilterChange({ dateTo: e.target.value })}
                  className="filter-select"
                />
              </div>

              {/* Search Query */}
              <div className="filter-section">
                <label className="filter-label">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleFilterChange({ searchQuery: e.target.value })}
                  className="filter-select"
                  placeholder="Listing title, user, email..."
                />
              </div>

              {/* Items per Page */}
              <div className="filter-section">
                <label className="filter-label">Items per Page</label>
                <div className="select-container">
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
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
                  onClick={handleResetFilters}
                  className="reset-button"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 flex flex-col gap-5">
            {/* Listing Filter Badge */}
            {filterByListingId && reports.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-900 font-semibold text-sm">
                      📋 Filtering by Listing:
                    </span>
                    <span className="text-blue-700 font-medium">
                      "{reports[0]?.listingId?.title || 'Unknown Listing'}"
                    </span>
                    <span className="text-xs text-blue-600 font-mono bg-blue-100 px-2 py-1 rounded">
                      ID: {reports[0]?.listingId?.listingId || filterByListingId}
                    </span>
                  </div>
                  <button
                    onClick={() => handleFilterChange({ filterByListingId: '' })}
                    className="text-blue-700 hover:text-blue-900 font-medium text-sm underline"
                  >
                    Clear Listing Filter
                  </button>
                </div>
              </div>
            )}

            <div className="text-gray-600 text-sm">
              {!loading && (
                <p>{totalItems} report{totalItems !== 1 ? 's' : ''} found</p>
              )}
            </div>

            {/* Reports Grid */}
            {loading ? (
              <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-24 text-gray-500">
                <p className="text-xl">No reports found</p>
                <p className="text-sm mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {reports.map((report: any) => (
                  <div
                    key={report._id}
                    className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-[1.01] hover:shadow-lg ${
                      report.listingId?.isHidden ? 'opacity-50' : ''
                    }`}
                    onClick={() => navigate(`/listing/${report.listingId?._id}`)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                            {report.listingId?.title || 'Listing Deleted'}
                            {report.listingId?.isHidden && (
                              <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                                HIDDEN
                              </span>
                            )}
                          </h3>
                          {report.listingId?.listingId && (
                            <p className="text-xs text-gray-500 font-mono">
                              {report.listingId.listingId}
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          report.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' :
                          report.status === 'IN_REVIEW' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {report.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700 w-28">Category:</span>
                          <span>{REPORT_CATEGORIES.find(c => c.value === report.reportCategory)?.label || report.reportCategory}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700 w-28">Reporter:</span>
                          <span>{report.reporterId ? `${report.reporterId.first_name} ${report.reporterId.last_name} (${report.reporterId.email})` : 'Unknown'}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700 w-28">Reported User:</span>
                          <span>{report.sellerId ? `${report.sellerId.first_name} ${report.sellerId.last_name} (${report.sellerId.email})` : 'Unknown'}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700 w-28">Reported:</span>
                          <span>{new Date(report.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      {report.details && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <p className="text-sm text-gray-700 italic">"{report.details}"</p>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/listing/${report.listingId?._id}`);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                      >
                        View Listing →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </main>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminReportsPage;
