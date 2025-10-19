import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    // Show 3 pages on mobile, 5 pages on desktop (excluding arrows)
    const isMobile = window.innerWidth <= 480;
    const maxVisible = isMobile ? 3 : 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate the range of pages to show around current page
      let start, end;
      
      if (isMobile) {
        // Mobile: show 3 pages around current page
        if (currentPage <= 2) {
          start = 1;
          end = 3;
        } else if (currentPage >= totalPages - 1) {
          start = totalPages - 2;
          end = totalPages;
        } else {
          start = currentPage - 1;
          end = currentPage + 1;
        }
      } else {
        // Desktop: show 5 pages around current page
        if (currentPage <= 3) {
          start = 1;
          end = 5;
        } else if (currentPage >= totalPages - 2) {
          start = totalPages - 4;
          end = totalPages;
        } else {
          start = currentPage - 2;
          end = currentPage + 2;
        }
      }

      // Add pages in the calculated range
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination">
      <button
        className="pagination-button first"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        title="First page"
      >
        ««
      </button>

      <button
        className="pagination-button prev"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        title="Previous page"
      >
        «
      </button>

      <div className="pagination-pages">
        {getVisiblePages().map((page, index) => (
          <button
            key={index}
            className={`pagination-page ${
              page === currentPage ? 'active' : ''
            } ${typeof page === 'string' ? 'ellipsis' : ''}`}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={typeof page === 'string'}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        className="pagination-button next"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        title="Next page"
      >
        »
      </button>

      <button
        className="pagination-button last"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        title="Last page"
      >
        »»
      </button>
    </div>
  );
};

export default Pagination;
