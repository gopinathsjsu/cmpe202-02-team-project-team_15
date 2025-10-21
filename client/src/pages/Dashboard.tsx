import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const handleBuyItems = () => {
    navigate('/search');
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">CM</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Campus Market</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.email}</span>
              <button 
                onClick={handleLogout}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200 btn-enhanced"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-2xl shadow-lg p-8 card-enhanced">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to Campus Market, {user?.first_name}!
            </h2>
            <p className="text-gray-600 mb-6">
              You have successfully logged in. This is your dashboard.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button 
                onClick={handleBuyItems}
                className="bg-gray-50 rounded-lg p-6 card-enhanced hover:bg-gray-100 transition-colors duration-200 text-left w-full"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Buy Items</h3>
                <p className="text-gray-600 text-sm">Browse and purchase items from other students</p>
              </button>
              <div className="bg-gray-50 rounded-lg p-6 card-enhanced">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sell Items</h3>
                <p className="text-gray-600 text-sm">List your items for sale to other students</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 card-enhanced">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">My Account</h3>
                <p className="text-gray-600 text-sm">Manage your profile and account settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
