import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Menu, 
  Search, 
  Mic, 
  Video, 
  Bell, 
  User,
  LogOut,
  Settings
} from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-youtube-dark border-b border-youtube-gray">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 h-14 sm:h-16">
        {/* Left Section */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button className="p-1.5 sm:p-2 hover:bg-youtube-gray rounded-full transition-colors duration-200">
            <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 hover:text-white" />
          </button>
          
          <Link to="/" className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-youtube-red rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm">V</span>
            </div>
            <span className="text-white font-bold text-lg sm:text-xl hidden sm:block">VideoApp</span>
          </Link>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-md sm:max-w-lg lg:max-w-2xl mx-3 sm:mx-4 lg:mx-8">
          <form onSubmit={handleSearch} className="flex">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-youtube-dark border border-youtube-gray text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-l-full focus:outline-none focus:border-blue-500 text-sm sm:text-base"
              />
            </div>
            <button
              type="submit"
              className="bg-youtube-gray border border-youtube-gray border-l-0 px-3 sm:px-6 py-1.5 sm:py-2 rounded-r-full hover:bg-youtube-hover transition-colors duration-200 flex items-center justify-center"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 hover:text-white" />
            </button>
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button className="p-1.5 sm:p-2 hover:bg-youtube-gray rounded-full transition-colors duration-200 hidden sm:block">
            <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 hover:text-white" />
          </button>
          
          <button className="p-1.5 sm:p-2 hover:bg-youtube-gray rounded-full transition-colors duration-200 hidden sm:block">
            <Video className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 hover:text-white" />
          </button>
          
          <button className="p-1.5 sm:p-2 hover:bg-youtube-gray rounded-full transition-colors duration-200 relative">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 hover:text-white" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-youtube-red rounded-full"></div>
          </button>

          {/* User Menu */}
          <div className="relative">
            {user ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-youtube-red rounded-full flex items-center justify-center hover:bg-red-700 transition-colors duration-200"
              >
                <span className="text-white font-medium text-xs sm:text-sm">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-youtube-red text-white rounded-full hover:bg-red-700 transition-colors duration-200 text-xs sm:text-sm"
              >
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            {/* Dropdown Menu */}
            {showUserMenu && user && (
              <div className="absolute right-0 mt-2 w-48 bg-youtube-gray rounded-lg shadow-lg border border-youtube-hover z-50">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-youtube-hover">
                    <p className="text-white font-medium text-sm">{user.username}</p>
                    <p className="text-youtube-light-gray text-xs">{user.email}</p>
                  </div>
                  
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-3 px-4 py-2 text-white hover:bg-youtube-hover transition-colors duration-200 text-sm"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  
                  <button
                    className="flex items-center space-x-3 px-4 py-2 text-white hover:bg-youtube-hover transition-colors duration-200 w-full text-sm"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-2 text-white hover:bg-youtube-hover transition-colors duration-200 w-full text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
