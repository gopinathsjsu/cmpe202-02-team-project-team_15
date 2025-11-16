import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserX, UserCheck, Mail, Calendar, X, AlertCircle, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';
import Pagination from '../components/Pagination';
import { apiService } from '../services/api';

interface SuspendedUser {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const SuspendedUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<SuspendedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(20);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<SuspendedUser | null>(null);

  const fetchSuspendedUsers = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getSuspendedUsers({
        page,
        limit: pageSize,
      });

      setUsers(response.data.users);
      setTotalPages(response.data.pagination.total_pages);
      setTotalItems(response.data.pagination.total_users);
      setCurrentPage(page);
    } catch (err: any) {
      console.error('Failed to fetch suspended users:', err);
      setError('Failed to load suspended users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuspendedUsers(currentPage);
  }, []);

  const handleUnsuspendClick = (user: SuspendedUser) => {
    setSelectedUser(user);
    setShowConfirmModal(true);
  };

  const handleConfirmUnsuspend = async () => {
    if (!selectedUser) return;

    setShowConfirmModal(false);
    setProcessingUserId(selectedUser._id);
    
    try {
      const response = await apiService.unsuspendUser(selectedUser._id);
      console.log('Unsuspend response:', response);
      
      // Remove the user from the current list immediately
      setUsers(prevUsers => prevUsers.filter(u => u._id !== selectedUser._id));
      setTotalItems(prev => prev - 1);
      
      // Show success message
      setModalMessage(response.message || 'User unsuspended successfully');
      setShowSuccessModal(true);
      
      // If current page is now empty and not the first page, go back one page
      if (users.length === 1 && currentPage > 1) {
        fetchSuspendedUsers(currentPage - 1);
      } else if (users.length === 1 && totalPages > 1) {
        // Last user on first page, refresh to check if there are more pages
        fetchSuspendedUsers(1);
      }
    } catch (err: any) {
      console.error('Unsuspend error full:', err);
      console.error('Unsuspend error response:', err.response);
      setModalMessage(err.response?.data?.message || 'Failed to unsuspend user');
      setShowErrorModal(true);
    } finally {
      setProcessingUserId(null);
      setSelectedUser(null);
    }
  };

  const handlePageChange = (page: number) => {
    fetchSuspendedUsers(page);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto p-4 lg:p-5">
        <div className="mb-4">
          <BackButton />
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <UserX className="w-8 h-8 mr-3 text-orange-600" />
                Suspended Users
              </h1>
              <p className="text-gray-600 mt-2">
                Manage suspended user accounts and restore access
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-orange-600">{totalItems}</div>
              <div className="text-sm text-gray-500">Suspended</div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg border border-red-200 mb-4">
            {error}
          </div>
        )}

        {/* Users List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <UserCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Suspended Users
            </h3>
            <p className="text-gray-600">
              All users are currently active. Suspended users will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Suspended On
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <UserX className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="w-4 h-4 mr-2" />
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(user.updated_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                            Suspended
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleUnsuspendClick(user)}
                            disabled={processingUserId === user._id}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            {processingUserId === user._id ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Processing...
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Unsuspend
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Confirm Unsuspend</h3>
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setSelectedUser(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mb-6">
                  <p className="text-gray-700 mb-4">
                    Are you sure you want to unsuspend <strong>{selectedUser.first_name} {selectedUser.last_name}</strong>?
                  </p>
                  <p className="text-sm text-gray-600">
                    This will restore their account and unhide all their listings.
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmUnsuspend}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Unsuspend User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-green-100 rounded-full p-2 mr-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Success</h3>
                  </div>
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-700 mb-6">{modalMessage}</p>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-red-100 rounded-full p-2 mr-3">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Error</h3>
                  </div>
                  <button
                    onClick={() => setShowErrorModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-700 mb-6">{modalMessage}</p>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowErrorModal(false)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuspendedUsersPage;
