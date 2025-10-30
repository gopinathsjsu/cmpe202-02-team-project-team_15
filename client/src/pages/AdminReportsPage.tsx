import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

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
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const AdminReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, total_reports: 0, per_page: 20 });
  const [filters, setFilters] = useState<{
    status: string[];
    category: string[];
    from: string;
    to: string;
    q: string;
    page: number;
    pageSize: number;
    sort: string;
  }>({
    status: [],
    category: [],
    from: '',
    to: '',
    q: '',
    page: 1,
    pageSize: 20,
    sort: 'desc',
  });
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const status = searchParams.getAll('status');
    const category = searchParams.getAll('category');
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const q = searchParams.get('q') || '';
    const page = +(searchParams.get('page') || 1);
    const pageSize = +(searchParams.get('pageSize') || 20);
    const sort = searchParams.get('sort') || 'desc';
    setFilters(f => ({ ...f, status, category, from, to, q, page, pageSize, sort }));
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    filters.status.forEach((s: string) => params.append('status', s));
    filters.category.forEach((c: string) => params.append('category', c));
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.q) params.append('q', filters.q);
    params.set('page', filters.page.toString());
    params.set('pageSize', filters.pageSize.toString());
    params.set('sort', filters.sort);
    fetch(`/api/admin/reports?${params.toString()}`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        setReports(data.data?.reports || []);
        setPagination(data.data?.pagination || pagination);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load reports');
        setLoading(false);
      });
    // eslint-disable-next-line
  }, [filters.status, filters.category, filters.from, filters.to, filters.q, filters.page, filters.pageSize, filters.sort]);

  function handleFilterChange(newFilters: any) {
    setFilters(f => ({ ...f, ...newFilters, page: 1 }));
    const nextParams = new URLSearchParams();
    Object.entries({ ...filters, ...newFilters, page: 1 }).forEach(([k, val]: any) => {
      if (Array.isArray(val)) val.forEach((v: string) => v && nextParams.append(k, v));
      else if (val) nextParams.set(k, val);
    });
    setSearchParams(nextParams);
  }
  function handleClearFilters() {
    setSearchParams('');
  }
  function handlePageChange(page: number) {
    handleFilterChange({ page });
  }
  function handlePageSizeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    handleFilterChange({ pageSize: +e.target.value, page: 1 });
  }
  function closeFilterMenu() {
    setIsFilterMenuOpen(false);
  }
  // UI
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header (same as marketplace style) */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16 space-x-6">
          <h1 className="text-2xl font-bold flex-1">Reports</h1>
        </div>
      </header>
      <div className="max-w-7xl mx-auto p-4 lg:p-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Filter Sidebar */}
          <div className={`${isFilterMenuOpen ? 'block lg:hidden' : 'hidden lg:block'} w-full lg:w-72 flex-shrink-0 bg-white rounded-xl p-6 h-fit shadow-lg`}>
            {/* Mobile Header for filter */}
            {isFilterMenuOpen && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button onClick={closeFilterMenu} className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}
            <div className="space-y-4">
              {/* Status Multi-Select */}
              <div>
                <label className="block text-xs font-semibold mb-1">Status</label>
                <select
                  multiple
                  value={filters.status}
                  onChange={e => handleFilterChange({ status: Array.from(e.target.selectedOptions).map(opt => opt.value) })}
                  className="w-full min-h-[2.6rem] bg-white border-gray-300 rounded px-2 py-1 text-sm"
                >
                  {REPORT_STATUSES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              {/* Category Multi-Select */}
              <div>
                <label className="block text-xs font-semibold mb-1">Category</label>
                <select
                  multiple
                  value={filters.category}
                  onChange={e => handleFilterChange({ category: Array.from(e.target.selectedOptions).map(opt => opt.value) })}
                  className="w-full min-h-[2.6rem] bg-white border-gray-300 rounded px-2 py-1 text-sm"
                >
                  {REPORT_CATEGORIES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              {/* Date range */}
              <div>
                <label className="block text-xs font-semibold mb-1">From</label>
                <input type="date" value={filters.from} onChange={e => handleFilterChange({ from: e.target.value })} className="border-gray-300 rounded px-2 py-1 text-sm w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">To</label>
                <input type="date" value={filters.to} onChange={e => handleFilterChange({ to: e.target.value })} className="border-gray-300 rounded px-2 py-1 text-sm w-full" />
              </div>
              {/* Search */}
              <div>
                <label className="block text-xs font-semibold mb-1">Search</label>
                <input
                  type="search"
                  className="w-full border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="Listing title/ID, user, email..."
                  value={filters.q}
                  onChange={e => handleFilterChange({ q: e.target.value })}
                />
              </div>
              <button type="button" className="text-xs text-blue-600 underline" onClick={handleClearFilters}>Clear filters</button>
            </div>
          </div>

          {/* Results Main Area */}
          <main className="flex-1 flex flex-col gap-6">
            {/* Desktop toggle not necessary, but you can add a button on mobile if needed */}
            {loading ? (
              <div className="text-center py-24 text-lg text-gray-500">Loading...</div>
            ) : error ? (
              <div className="text-center text-red-600 py-24">{error}</div>
            ) : reports.length === 0 ? (
              <div className="py-24 text-center text-gray-400">No reports found</div>
            ) : (
              <div className="grid gap-4">
                {reports.map((r: any) => (
                  <div
                    key={r._id}
                    className="bg-white rounded-xl shadow p-5 flex flex-col sm:flex-row sm:items-center sm:gap-6 hover:shadow-lg transition cursor-pointer group border border-gray-100"
                    onClick={() => navigate(`/listing/${r.listingId?.listingId}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs text-gray-500" title={new Date(r.createdAt).toLocaleString()}>{timeAgo(r.createdAt)}</span>
                        <span>{statusBadge(r.status)}</span>
                        <span className="inline-block bg-gray-100 rounded px-2 py-0.5 text-xs text-gray-500 ml-2">{categoryLabel(r.reportCategory)}</span>
                      </div>
                      <div className="font-bold text-lg text-blue-800 group-hover:underline mb-1">{r.listingId?.title || 'Listing Deleted'}</div>
                      <div className="flex flex-wrap text-xs text-gray-600 gap-x-4 gap-y-1 mb-1">
                        <span>
                          Listing ID: <span className="font-mono font-medium text-black">{r.listingId?.listingId}</span>
                        </span>
                        <span>
                          Reporter: {userSummary(r.reporterId)}
                        </span>
                        <span>
                          Reported User: {userSummary(r.sellerId)}
                        </span>
                      </div>
                      {r.details && (
                        <div className="mt-2 text-sm text-gray-800 bg-gray-50 rounded p-2 italic">
                          "{r.details}"
                        </div>
                      )}
                    </div>
                    <div className="mt-4 sm:mt-0 flex flex-col items-end justify-between min-w-[120px]">
                      <button
                        type="button"
                        className="underline text-blue-600 text-xs font-bold px-2 py-1 rounded hover:text-blue-900"
                        onClick={e => { e.stopPropagation(); navigate(`/listing/${r.listingId?.listingId}`); }}
                      >Open Listing</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between my-4">
              <span className="text-xs text-gray-600">Page {pagination.current_page} of {pagination.total_pages} ({pagination.total_reports} total)</span>
              <div className="flex items-center gap-2">
                <button type="button" disabled={filters.page <= 1} className="px-2 py-1 rounded border text-xs disabled:opacity-50" onClick={() => handlePageChange(filters.page - 1)}>Prev</button>
                <button type="button" disabled={filters.page >= pagination.total_pages} className="px-2 py-1 rounded border text-xs disabled:opacity-50" onClick={() => handlePageChange(filters.page + 1)}>Next</button>
                <select value={filters.pageSize} className="border rounded px-1 py-0.5 text-xs" onChange={handlePageSizeChange}>
                  {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}/page</option>)}
                </select>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

function categoryLabel(raw: string) {
  const found = REPORT_CATEGORIES.find(x => x.value === raw);
  return found ? found.label : raw;
}
function statusBadge(status: string) {
  const color =
    status === 'OPEN' ? 'bg-yellow-200 text-yellow-900' :
      status === 'IN_REVIEW' ? 'bg-blue-200 text-blue-900' :
        status === 'CLOSED' ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-600';
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${color}`}>{status.replace(/_/g, ' ')}</span>;
}
function userSummary(user: any) {
  if (!user) return null;
  return <span className="font-medium">{user.first_name} {user.last_name}<br /><span className="text-xs text-gray-500">{user.email}</span></span>;
}
function timeAgo(date: string) {
  const now = new Date();
  const d = new Date(date);
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return d.toLocaleDateString();
}

export default AdminReportsPage;
