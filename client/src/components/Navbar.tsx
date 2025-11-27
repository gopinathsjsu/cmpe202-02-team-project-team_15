import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { MessageSquare, Heart, BarChart3, FolderTree, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import api from '../services/api';
import { Avatar } from './Avatar';
import ProfileImageMenu from './ProfileImageMenu';
import ImageViewerModal from './ImageViewerModal';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, setUser } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProfileOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.profile-dropdown')) {
          setIsProfileOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

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
              <Link 
                to="/profile"
                className="hover:opacity-80 transition-opacity profile-image-trigger"
              >
                <Avatar
                  photoUrl={user?.photoUrl || user?.photo_url}
                  firstName={user?.first_name}
                  lastName={user?.last_name}
                  email={user?.email}
                  size={32}
                />
              </Link>

              {/* Profile Image Menu */}
              {user?.photoUrl || user?.photo_url ? (
                <ProfileImageMenu
                  isOpen={isImageMenuOpen}
                  onClose={() => setIsImageMenuOpen(false)}
                  onView={() => {
                    setShowViewModal(true);
                    setIsImageMenuOpen(false);
                  }}
                  onEdit={() => {
                    navigate('/profile');
                    setIsImageMenuOpen(false);
                  }}
                  onDelete={() => {
                    setShowDeleteConfirm(true);
                    setIsImageMenuOpen(false);
                  }}
                />
              ) : (
                <ProfileImageMenu
                  isOpen={isImageMenuOpen}
                  onClose={() => setIsImageMenuOpen(false)}
                  onView={() => setIsImageMenuOpen(false)}
                  onEdit={() => {
                    navigate('/profile');
                    setIsImageMenuOpen(false);
                  }}
                  onDelete={() => setIsImageMenuOpen(false)}
                />
              )}

              {/* View Image Modal */}
              <ImageViewerModal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                imageUrl={user?.photoUrl || user?.photo_url || null}
              />

              {/* Delete Confirmation Modal */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Delete Profile Photo</h2>
                    <p className="text-gray-600 mb-6">
                      Are you sure you want to delete your profile photo? This action cannot be undone.
                    </p>
                    <div className="flex space-x-3 justify-end">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          setIsDeleting(true);
                          try {
                            await apiService.deleteProfilePhoto();
                            
                            // Refresh user data
                            const res = await api.get("/api/profile");
                            const profileData = res.data;
                            
                            const updated = {
                              id: profileData._id || profileData.id || user?.id,
                              email: profileData.email,
                              first_name: profileData.first_name,
                              last_name: profileData.last_name,
                              status: profileData.status,
                              roles: profileData.roles || [],
                              photoUrl: null,
                              photo_url: null,
                            };
                            
                            setUser(updated);
                            localStorage.setItem('user', JSON.stringify(updated));
                            setShowDeleteConfirm(false);
                          } catch (error: any) {
                            console.error('Failed to delete profile photo:', error);
                            alert(error.response?.data?.message || 'Failed to delete profile photo');
                          } finally {
                            setIsDeleting(false);
                          }
                        }}
                        disabled={isDeleting}
                        className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {isDeleting ? (
                          <span>Deleting...</span>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-20 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-900">{user?.first_name} {user?.last_name}</div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setIsProfileOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Your Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate('/my-listings');
                      setIsProfileOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    My Listings
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setIsProfileOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-200"
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

