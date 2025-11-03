import React from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";

interface ListingPreviewProps {
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingImage?: string;
}

export const ListingPreview: React.FC<ListingPreviewProps> = ({
  listingId,
  listingTitle,
  listingPrice,
  listingImage,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/listing/${listingId}`);
  };

  return (
    <div
      onClick={handleClick}
      className="mt-2 border border-gray-300 rounded-lg overflow-hidden bg-white cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex">
        {/* Image */}
        <div className="w-20 h-20 flex-shrink-0 bg-gray-200">
          {listingImage ? (
            <img
              src={listingImage}
              alt={listingTitle}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-image.svg";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs text-gray-400">No image</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-gray-900 truncate">
                {listingTitle}
              </h4>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                ${listingPrice.toLocaleString()}
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
};

