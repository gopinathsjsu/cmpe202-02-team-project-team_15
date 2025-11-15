import React, { useState } from 'react';
import { X, UserX, Trash2, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api';

interface ManageUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  listingId?: string; // Optional listing ID to hide when suspending
  onSuccess: () => void;
}

type ActionType = 'suspend' | 'delete' | null;

const ManageUserModal: React.FC<ManageUserModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  listingId,
  onSuccess,
}) => {
  const [selectedAction, setSelectedAction] = useState<ActionType>(null);
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    if (!isProcessing) {
      setSelectedAction(null);
      setReason('');
      setError('');
      onClose();
    }
  };

  const handleActionSelect = (action: ActionType) => {
    setSelectedAction(action);
    setError('');
  };

  const handleConfirm = async () => {
    if (!selectedAction) return;

    setIsProcessing(true);
    setError('');

    try {
      if (selectedAction === 'suspend') {
        await apiService.suspendUser(userId, reason, listingId);
      } else {
        await apiService.deleteUser(userId, reason);
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || `Failed to ${selectedAction} user`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">
                Manage User Account
              </h3>
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="text-purple-100 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-5">
            {/* User Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">User Information</h4>
              <p className="text-sm text-gray-900 font-medium">{userName}</p>
              <p className="text-sm text-gray-600">{userEmail}</p>
              <p className="text-xs text-gray-500 mt-1">ID: {userId}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {!selectedAction ? (
              // Action Selection
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  Select an action to perform on this user account:
                </p>

                {/* Suspend Button */}
                <button
                  onClick={() => handleActionSelect('suspend')}
                  className="w-full flex items-center justify-between p-4 border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <UserX className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Suspend Account</p>
                      <p className="text-sm text-gray-600">
                        Temporarily disable user access
                      </p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleActionSelect('delete')}
                  className="w-full flex items-center justify-between p-4 border-2 border-red-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                      <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Delete Account</p>
                      <p className="text-sm text-gray-600">
                        Permanently remove user and hide listings
                      </p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ) : (
              // Confirmation Form
              <div className="space-y-4">
                {/* Warning Banner */}
                <div className={`p-4 rounded-lg border-2 ${
                  selectedAction === 'delete' 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                      selectedAction === 'delete' ? 'text-red-600' : 'text-orange-600'
                    }`} />
                    <div>
                      <h4 className={`font-semibold ${
                        selectedAction === 'delete' ? 'text-red-900' : 'text-orange-900'
                      }`}>
                        {selectedAction === 'delete' ? 'Permanent Action' : 'Account Suspension'}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        selectedAction === 'delete' ? 'text-red-700' : 'text-orange-700'
                      }`}>
                        {selectedAction === 'delete' 
                          ? 'This will mark the account as deleted, revoke all sessions, and hide all user listings. This action cannot be undone.'
                          : 'This will suspend the user account and revoke all active sessions. The user will not be able to log in.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reason Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason {selectedAction === 'delete' && <span className="text-red-600">*</span>}
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={`Explain why you are ${selectedAction === 'delete' ? 'deleting' : 'suspending'} this account...`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={4}
                    disabled={isProcessing}
                  />
                  {selectedAction === 'delete' && (
                    <p className="text-xs text-gray-500 mt-1">
                      A reason is strongly recommended for accountability and audit purposes.
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setSelectedAction(null)}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    className={`flex-1 px-4 py-2.5 font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                      selectedAction === 'delete'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      `Confirm ${selectedAction === 'delete' ? 'Delete' : 'Suspend'}`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!selectedAction && (
            <div className="bg-gray-50 px-6 py-4">
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageUserModal;
