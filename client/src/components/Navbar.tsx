import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Heart, BarChart3, FolderTree } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProfileDropdown } from './ProfileDropdown';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Helper to determine if a route is active
  const isActive = (path: string) => {
    if (path === '/search') {
      return location.pathname === '/search' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/search')}>
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CM</span>
              </div>
              <span className="font-semibold text-gray-900">Campus Market</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {/* Marketplace */}
            <button 
              onClick={() => navigate('/search')}
              className={`font-medium transition-colors ${
                isActive('/search') 
                  ? 'text-blue-600' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Marketplace
            </button>

            {/* Saved Listings */}
            <button 
              onClick={() => navigate('/saved')}
              className={`flex items-center space-x-1 font-medium transition-colors ${
                isActive('/saved') 
                  ? 'text-blue-600' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Heart className="w-5 h-5" />
              <span>Saved</span>
            </button>

            {/* Messages */}
            <button 
              onClick={() => navigate('/messages')}
              className={`flex items-center space-x-1 font-medium transition-colors ${
                isActive('/messages') 
                  ? 'text-blue-600' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </button>

            {/* Admin Links (only for admins) */}
            {user?.roles?.includes('admin') && (
              <>
                <button
                  onClick={() => navigate('/admin/reports')}
                  className={`flex items-center space-x-1 font-medium transition-colors ${
                    isActive('/admin/reports') 
                      ? 'text-blue-600' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Reports</span>
                </button>
                <button
                  onClick={() => navigate('/admin/categories')}
                  className={`flex items-center space-x-1 font-medium transition-colors ${
                    isActive('/admin/categories') 
                      ? 'text-blue-600' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <FolderTree className="w-5 h-5" />
                  <span>Categories</span>
                </button>
              </>
            )}

            {/* User Profile Dropdown */}
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

