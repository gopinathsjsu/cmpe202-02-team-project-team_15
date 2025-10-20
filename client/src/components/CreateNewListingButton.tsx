import React from 'react';

interface CreateNewListingButtonProps {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const CreateNewListingButton: React.FC<CreateNewListingButtonProps> = ({
  onClick,
  className = '',
  disabled = false
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`create-listing-button ${className}`}
    >
      <svg 
        className="w-4 h-4 mr-2" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 4v16m8-8H4" 
        />
      </svg>
      Create New Listing
    </button>
  );
};

export default CreateNewListingButton;
