import React from "react";
import { Eye, Camera, Trash2, X } from "lucide-react";

interface ProfileImageMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ProfileImageMenu: React.FC<ProfileImageMenuProps> = ({
  isOpen,
  onClose,
  onView,
  onEdit,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Profile Photo</p>
            <h3 className="text-lg font-semibold text-gray-900">
              Manage your picture
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close profile photo menu"
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 px-6 py-6 sm:grid-cols-3">
          <button
            onClick={() => {
              onView();
              onClose();
            }}
            className="group flex flex-col items-center rounded-xl border border-gray-200 p-4 transition hover:border-blue-500 hover:bg-blue-50"
          >
            <span className="rounded-full bg-blue-100 p-3 text-blue-600 transition group-hover:bg-blue-500 group-hover:text-white">
              <Eye className="h-5 w-5" />
            </span>
            <span className="mt-3 text-sm font-semibold text-gray-900 group-hover:text-blue-600">
              View Photo
            </span>
            <span className="mt-1 text-xs text-gray-500 text-center">
              Preview your current profile picture
            </span>
          </button>

          <button
            onClick={() => {
              onEdit();
              onClose();
            }}
            className="group flex flex-col items-center rounded-xl border border-gray-200 p-4 transition hover:border-gray-900 hover:bg-gray-900/5"
          >
            <span className="rounded-full bg-gray-100 p-3 text-gray-700 transition group-hover:bg-gray-900 group-hover:text-white">
              <Camera className="h-5 w-5" />
            </span>
            <span className="mt-3 text-sm font-semibold text-gray-900 group-hover:text-gray-900">
              Change Photo
            </span>
            <span className="mt-1 text-xs text-gray-500 text-center">
              Upload a new profile picture
            </span>
          </button>

          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="group flex flex-col items-center rounded-xl border border-gray-200 p-4 transition hover:border-red-500 hover:bg-red-50"
          >
            <span className="rounded-full bg-red-100 p-3 text-red-600 transition group-hover:bg-red-500 group-hover:text-white">
              <Trash2 className="h-5 w-5" />
            </span>
            <span className="mt-3 text-sm font-semibold text-gray-900 group-hover:text-red-600">
              Remove Photo
            </span>
            <span className="mt-1 text-xs text-gray-500 text-center">
              Delete and revert to initials
            </span>
          </button>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileImageMenu;
