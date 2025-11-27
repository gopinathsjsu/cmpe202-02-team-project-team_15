import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Heart, BarChart3, FolderTree } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Avatar } from './Avatar';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.profile-dropdown')) {
          setIsUserMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  useEffect(() => {
    let mounted = true;

    const fetchUnread = async () => {
      try {
        const data = await apiService.getUnreadMessagesCount();
        if (mounted) {
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Failed to fetch unread messages count:", error);
      }
    };

    fetchUnread();

    const handleUnreadUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<number>;
      setUnreadCount(customEvent.detail || 0);
    };

    window.addEventListener("messages:unread-count", handleUnreadUpdate);

    return () => {
      mounted = false;
      window.removeEventListener("messages:unread-count", handleUnreadUpdate);
    };
  }, [location.pathname]);

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
              className={`flex items-center space-x-2 font-medium transition-colors ${
                isActive('/messages') 
                  ? 'text-blue-600' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <span className="relative flex items-center justify-center mr-1">
                <MessageSquare className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-semibold rounded-full px-1.5 py-[1px]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </span>
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

            {/* User Avatar with Dropdown */}
            <div className="relative profile-dropdown">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center focus:outline-none"
              >
                <Avatar
                  photoUrl={user?.photoUrl || user?.photo_url}
                  firstName={user?.first_name}
                  lastName={user?.last_name}
                  email={user?.email}
                  size={32}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white z-20">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    onClick={() => {
                      navigate("/profile");
                      setIsUserMenuOpen(false);
                    }}
                  >
                    Your Profile
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    onClick={() => {
                      navigate("/my-listings");
                      setIsUserMenuOpen(false);
                    }}
                  >
                    My Listings
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

