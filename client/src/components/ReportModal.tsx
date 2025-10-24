import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { apiService } from "../services/api";
import { useToast } from "../contexts/ToastContext";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  onReportSubmitted: () => void;
}

const REPORT_CATEGORIES = [
  { value: "FRAUD", label: "Fraud", description: "Suspicious or fraudulent activity" },
  { value: "SCAM_COUNTERFEIT", label: "Scam/Counterfeit", description: "Fake or counterfeit items" },
  { value: "MISLEADING_WRONG_CATEGORY", label: "Misleading/Wrong Category", description: "Incorrect or misleading information" },
  { value: "INAPPROPRIATE_PROHIBITED_SAFETY", label: "Inappropriate/Prohibited/Safety", description: "Inappropriate, prohibited, or unsafe content" },
  { value: "OTHER", label: "Other", description: "Other reasons not listed above" },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  onReportSubmitted,
}) => {
  const { showLoading, showSuccess, showError, hideToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory) {
      setError("Please select a report category");
      return;
    }

    if (details.length > 500) {
      setError("Details must be 500 characters or less");
      return;
    }

    // Show loading toast
    const loadingToastId = showLoading(
      "Submitting Report",
      "Please wait while we process your report..."
    );

    try {
      setIsSubmitting(true);
      setError(null);
      
      await apiService.createReport(
        listingId,
        selectedCategory,
        details.trim() || undefined
      );

      // Hide loading toast and show success
      hideToast(loadingToastId);
      showSuccess(
        "Report Submitted Successfully!",
        "Thank you for helping keep our marketplace safe. We'll review your report soon."
      );

      onReportSubmitted();
      handleClose();
    } catch (err: any) {
      console.error("Error submitting report:", err);
      
      // Hide loading toast
      hideToast(loadingToastId);
      
      let errorMessage = "Failed to submit report. Please try again.";
      
      if (err.response?.status === 400) {
        if (err.response.data.message.includes("own listing")) {
          errorMessage = "You cannot report your own listing";
        } else if (err.response.data.message.includes("already reported")) {
          errorMessage = "You have already reported this listing";
        } else {
          errorMessage = err.response.data.message || "Invalid request";
        }
      } else if (err.response?.status === 409) {
        errorMessage = "You have already reported this listing";
      }

      // Show error toast
      showError("Report Failed", errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCategory("");
    setDetails("");
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
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Report Listing</h2>
                <p className="text-sm text-gray-600">Help us keep the marketplace safe</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Listing Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Reporting:</p>
            <p className="font-medium text-gray-900 truncate">{listingTitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Why are you reporting this listing? *
              </label>
              <div className="space-y-3">
                {REPORT_CATEGORIES.map((category) => (
                  <label
                    key={category.value}
                    className="flex items-start gap-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.value}
                      checked={selectedCategory === category.value}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="mt-1 w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {category.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {category.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please provide any additional details that might help us understand the issue..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  Help us understand the issue better
                </p>
                <span className="text-xs text-gray-400">
                  {details.length}/500
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
                disabled={!selectedCategory || isSubmitting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-colors"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
