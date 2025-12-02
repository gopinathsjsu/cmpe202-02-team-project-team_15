import React from "react";

interface ImageViewerModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  imageUrl,
  onClose,
}) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
      <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <img 
          src={imageUrl} 
          className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
          alt="Full size preview"
        />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-white rounded-full px-3 py-1 shadow hover:bg-gray-100 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ImageViewerModal;
