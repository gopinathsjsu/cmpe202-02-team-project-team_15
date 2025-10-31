import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api';

interface ReportedDetailsPanelProps {
  listingId: string;
}

const REPORT_CATEGORIES = [
  { label: 'Fraud', value: 'FRAUD' },
  { label: 'Scam / Counterfeit', value: 'SCAM_COUNTERFEIT' },
  { label: 'Misleading info / Wrong Category', value: 'MISLEADING_WRONG_CATEGORY' },
  { label: 'Inappropriate/Prohibited/Safety', value: 'INAPPROPRIATE_PROHIBITED_SAFETY' },
  { label: 'Other', value: 'OTHER' },
];

const REPORT_STATUSES = [
  { label: 'Open', value: 'OPEN' },
  { label: 'In Review', value: 'IN_REVIEW' },
  { label: 'Closed', value: 'CLOSED' },
];

const ReportedDetailsPanel: React.FC<ReportedDetailsPanelProps> = ({ listingId }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getAdminReports({
          listingId,
          pageSize: 100 // Get all reports for this listing
        });
        setReports(data?.reports || []);
      } catch (err: any) {
        console.error('Failed to load reports:', err);
        setError('Failed to load report details');
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      fetchReports();
    }
  }, [listingId]);

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-yellow-800">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-semibold">Loading report details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-red-800">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-semibold">{error}</span>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return null; // Don't show panel if no reports
  }

  // Calculate totals by status and category
  const statusCounts = REPORT_STATUSES.map(status => ({
    ...status,
    count: reports.filter(r => r.status === status.value).length
  })).filter(s => s.count > 0);

  const categoryCounts = REPORT_CATEGORIES.map(category => ({
    ...category,
    count: reports.filter(r => r.reportCategory === category.value).length
  })).filter(c => c.count > 0);

  // Get recent 5 reports
  const recentReports = reports
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-bold text-red-900">
            Reported Details - Admin View
          </h3>
        </div>
        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          {reports.length} Report{reports.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Summary by Status */}
      <div>
        <h4 className="text-sm font-semibold text-red-900 mb-2">Status Summary</h4>
        <div className="flex flex-wrap gap-2">
          {statusCounts.map(status => (
            <span
              key={status.value}
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                status.value === 'OPEN' ? 'bg-yellow-200 text-yellow-900' :
                status.value === 'IN_REVIEW' ? 'bg-blue-200 text-blue-900' :
                'bg-gray-200 text-gray-900'
              }`}
            >
              {status.label}: {status.count}
            </span>
          ))}
        </div>
      </div>

      {/* Summary by Category */}
      <div>
        <h4 className="text-sm font-semibold text-red-900 mb-2">Category Summary</h4>
        <div className="flex flex-wrap gap-2">
          {categoryCounts.map(category => (
            <span
              key={category.value}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-900"
            >
              {category.label}: {category.count}
            </span>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div>
        <h4 className="text-sm font-semibold text-red-900 mb-3">Recent Reports</h4>
        <div className="space-y-3">
          {recentReports.map((report) => (
            <div
              key={report._id}
              className="bg-white rounded-lg p-3 border border-red-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-semibold text-gray-700">
                      Reporter: {report.reporterId ? 
                        `${report.reporterId.first_name} ${report.reporterId.last_name}` : 
                        'Unknown'}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({report.reporterId?.email})
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(report.createdAt).toLocaleString()}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  report.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' :
                  report.status === 'IN_REVIEW' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {report.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-xs text-gray-600 mb-2">
                <span className="font-semibold">Category:</span>{' '}
                {REPORT_CATEGORIES.find(c => c.value === report.reportCategory)?.label || report.reportCategory}
              </div>
              {report.details && (
                <div className="text-sm text-gray-800 bg-gray-50 rounded p-2 italic">
                  "{report.details}"
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* View All Link */}
      <div className="pt-2">
        <button
          onClick={() => navigate(`/admin/reports?listingId=${listingId}`)}
          className="text-sm text-red-700 hover:text-red-900 font-semibold underline"
        >
          View All Reports for this Listing →
        </button>
      </div>
    </div>
  );
};

export default ReportedDetailsPanel;

