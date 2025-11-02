import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { apiService } from "../services/api";
import { useToast } from "../contexts/ToastContext";

interface WarnUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  onWarningSent: () => void;
}

export const WarnUserModal: React.FC<WarnUserModalProps> = ({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  onWarningSent,
}) => {
  const { showLoading, showSuccess, showError, hideToast } = useToast();
  const [customMessage, setCustomMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultMessage = `⚠️ WARNING: Your listing "${listingTitle}" has been flagged for violating marketplace rules. Please review and update your listing to comply with our guidelines.`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate message length if custom message is provided
    if (customMessage.trim().length > 4000) {
      setError("Message must be 4000 characters or less");
      return;
    }

    // Show loading toast
    const loadingToastId = showLoading(
      "Sending Warning",
      "Please wait while we send the warning message..."
    );

    try {
      setIsSubmitting(true);
      setError(null);

      await apiService.warnSeller(
        listingId,
        customMessage.trim() || undefined
      );

      // Hide loading toast and show success
      hideToast(loadingToastId);
      showSuccess(
        "Warning Sent Successfully!",
        "The seller has been notified about the listing violation."
      );

      onWarningSent();
      handleClose();
    } catch (err: any) {
      console.error("Error sending warning:", err);

      // Hide loading toast
      hideToast(loadingToastId);

      let errorMessage = "Failed to send warning. Please try again.";

      if (err.response?.status === 400) {
        errorMessage = err.response.data.message || "Invalid request";
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to warn users";
      } else if (err.response?.status === 404) {
        errorMessage = "Listing not found";
      }

      // Show error toast
      showError("Warning Failed", errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCustomMessage("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Warn Seller</h2>
                <p className="text-sm text-gray-600">Send a warning message about this listing</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Listing Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Warning for listing:</p>
            <p className="font-medium text-gray-900 truncate">{listingTitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Default Message Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Warning Message
              </label>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-gray-700">
                {defaultMessage}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This message will be sent if you don't provide a custom message below.
              </p>
            </div>

            {/* Custom Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Warning Message (Optional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter a custom warning message, or leave empty to use the default message above..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                rows={4}
                maxLength={4000}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  Leave empty to use default message
                </p>
                <span className="text-xs text-gray-400">
                  {customMessage.length}/4000
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-colors"
              >
                {isSubmitting ? "Sending..." : "Send Warning"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

