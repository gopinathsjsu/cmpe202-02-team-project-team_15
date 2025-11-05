import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Settings } from 'lucide-react';
import { authAPI } from '../services/auth';

export const ProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still logout locally even if server request fails
      logout();
      navigate('/login');
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 focus:outline-none"
      >
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
          {user.first_name[0].toUpperCase()}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <div className="px-4 py-2 text-sm text-gray-700 border-b">
              <div className="font-medium">{`${user.first_name} ${user.last_name}`}</div>
              <div className="text-gray-500 text-xs">{user.email}</div>
            </div>

            <a
              href="/profile"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              role="menuitem"
            >
              <User className="h-4 w-4 mr-2" />
              Your Profile
            </a>
            
            <a
              href="/settings"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              role="menuitem"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </a>

            <button
              onClick={handleLogout}
              className="flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 cursor-pointer"
              role="menuitem"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};