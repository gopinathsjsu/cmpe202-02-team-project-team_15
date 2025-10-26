import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  currentPage?: 'marketplace' | 'messages' | 'dashboard';
}

const Navigation: React.FC<NavigationProps> = ({ currentPage = 'marketplace' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getUserInitial = () => {
    if (user?.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CM</span>
              </div>
              <span className="font-semibold text-gray-900">Campus Market</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => navigate('/search')}
              className={`text-sm transition-colors duration-200 ${
                currentPage === 'marketplace' 
                  ? 'text-gray-900 font-medium' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Marketplace
            </button>
            
            <button 
              onClick={() => navigate('/messages')}
              className={`text-sm transition-colors duration-200 flex items-center space-x-1 ${
                currentPage === 'messages' 
                  ? 'text-gray-900 font-medium' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
            </button>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-700 text-sm font-medium">{getUserInitial()}</span>
                </div>
                <span className="text-sm text-gray-700 hidden sm:block">
                  {user?.first_name || user?.email}
                </span>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
