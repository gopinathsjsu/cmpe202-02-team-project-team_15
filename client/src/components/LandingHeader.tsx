import React from 'react';
import { Link } from 'react-router-dom';

const LandingHeader: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-900 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
              <span className="text-white font-bold text-lg md:text-xl">CM</span>
            </div>
            <span className="text-xl md:text-2xl font-bold text-gray-900">Campus Market</span>
          </Link>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-3 md:space-x-4">
            <Link
              to="/login"
              className="px-4 py-2 md:px-5 md:py-2.5 text-sm md:text-base font-medium text-gray-700 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 md:px-6 md:py-2.5 text-sm md:text-base font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;

