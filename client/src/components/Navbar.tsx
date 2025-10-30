import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/search')}>
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CM</span>
              </div>
              <span className="font-semibold text-gray-900">Campus Market</span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => navigate('/search')}
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              Marketplace
            </button>
            <button 
              onClick={() => navigate('/messages')}
              className="text-gray-700 hover:text-gray-900 flex items-center space-x-1"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </button>
            {user?.roles?.includes('admin') && (
              <button
                onClick={() => navigate('/admin/reports')}
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Admin / Reports
              </button>
            )}
            <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-700 text-sm font-medium">
                {user?.first_name?.[0]?.toUpperCase() || 'A'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

