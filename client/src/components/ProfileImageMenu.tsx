import React from "react";

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
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-lg shadow p-4 w-64">
        <button onClick={onView} className="block w-full text-left py-2">
          View Image
        </button>

        <button onClick={onEdit} className="block w-full text-left py-2">
          Edit Image
        </button>

        <button
          onClick={onDelete}
          className="block w-full text-left py-2 text-red-600"
        >
          Delete Image
        </button>

        <button onClick={onClose} className="block w-full text-left py-2">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ProfileImageMenu;
