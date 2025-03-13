import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { FiMenu, FiX, FiUser, FiLogOut, FiSettings, FiBell, FiSearch, FiBookmark, FiClock } from 'react-icons/fi';

export const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  return (
    <header className="bg-white dark:bg-dark-300 shadow-sm border-b border-light-500 dark:border-dark-100 sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-dark-300/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-light-800 dark:text-light-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-light-200 dark:hover:bg-dark-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <span className="sr-only">Open main menu</span>
              {showMobileMenu ? (
                <FiX className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <FiMenu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center md:justify-start">
            <div className="md:hidden">
              <Link to="/dashboard" className="flex items-center">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M12 7.76L4.64 15.11C4.14 15.61 3.25 15.61 2.76 15.11V15.11C2.34 14.7 2.34 14.02 2.76 13.6L11.47 4.89C11.76 4.6 12.24 4.6 12.53 4.89L21.24 13.6C21.66 14.02 21.66 14.7 21.24 15.11V15.11C20.75 15.61 19.86 15.61 19.36 15.11L12 7.76Z" />
                    <path d="M12 12.44L19.04 19.5C19.52 19.97 19.52 20.75 19.04 21.22C18.56 21.69 17.78 21.69 17.3 21.22L12.53 16.43C12.38 16.29 12.15 16.22 11.93 16.22C11.71 16.22 11.49 16.29 11.33 16.43L6.7 21.22C6.22 21.69 5.44 21.69 4.96 21.22C4.48 20.75 4.48 19.97 4.96 19.5L12 12.44Z" />
                  </svg>
                </div>
              </Link>
            </div>
            
            {/* Search bar */}
            <div className="flex-1 max-w-xl mx-4">
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-light-700 dark:text-light-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search for news, topics, sources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-light-400 dark:border-dark-100 rounded-lg bg-light-100 dark:bg-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent text-sm transition-colors"
                />
              </form>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="flex items-center">
              <button
                type="button"
                className="p-2 rounded-full text-light-800 dark:text-light-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-light-200 dark:hover:bg-dark-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <span className="sr-only">View notifications</span>
                <div className="relative">
                  <FiBell className="h-6 w-6" aria-hidden="true" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-dark-300"></span>
                </div>
              </button>
              
              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    id="user-menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-medium shadow-md">
                      {user?.first_name ? user.first_name[0] : 'U'}
                    </div>
                  </button>
                </div>
                
                {/* Profile dropdown menu */}
                {showProfileMenu && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-64 rounded-xl shadow-lg py-1 bg-white dark:bg-dark-300 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-light-500 dark:border-dark-100"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <div className="px-4 py-3 border-b border-light-300 dark:border-dark-100">
                      <div className="font-medium text-sm">{user?.first_name} {user?.last_name}</div>
                      <div className="text-xs text-light-700 dark:text-light-500 truncate">{user?.email}</div>
                    </div>
                    
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-light-900 dark:text-light-300 hover:bg-light-100 dark:hover:bg-dark-200"
                        role="menuitem"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <FiUser className="mr-3 h-4 w-4 text-light-700 dark:text-light-500" />
                        Your Profile
                      </Link>
                      
                      <Link
                        to="/interests"
                        className="flex items-center px-4 py-2 text-sm text-light-900 dark:text-light-300 hover:bg-light-100 dark:hover:bg-dark-200"
                        role="menuitem"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <FiBookmark className="mr-3 h-4 w-4 text-light-700 dark:text-light-500" />
                        Your Interests
                      </Link>
                      
                      <Link
                        to="/history"
                        className="flex items-center px-4 py-2 text-sm text-light-900 dark:text-light-300 hover:bg-light-100 dark:hover:bg-dark-200"
                        role="menuitem"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <FiClock className="mr-3 h-4 w-4 text-light-700 dark:text-light-500" />
                        Reading History
                      </Link>
                      
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-light-900 dark:text-light-300 hover:bg-light-100 dark:hover:bg-dark-200"
                        role="menuitem"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <FiSettings className="mr-3 h-4 w-4 text-light-700 dark:text-light-500" />
                        Settings
                      </Link>
                    </div>
                    
                    <div className="py-1 border-t border-light-300 dark:border-dark-100">
                      <button
                        className="flex w-full items-center px-4 py-2 text-sm text-light-900 dark:text-light-300 hover:bg-light-100 dark:hover:bg-dark-200"
                        role="menuitem"
                        onClick={handleLogout}
                      >
                        <FiLogOut className="mr-3 h-4 w-4 text-light-700 dark:text-light-500" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white dark:bg-dark-300 border-b border-light-500 dark:border-dark-100 animate-slide-up">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/dashboard"
              className="block pl-3 pr-4 py-2 mx-2 rounded-lg text-base font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
              onClick={() => setShowMobileMenu(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/digest"
              className="block pl-3 pr-4 py-2 mx-2 rounded-lg text-base font-medium text-light-900 dark:text-light-300 hover:bg-light-100 dark:hover:bg-dark-200"
              onClick={() => setShowMobileMenu(false)}
            >
              Digest
            </Link>
            <Link
              to="/trending"
              className="block pl-3 pr-4 py-2 mx-2 rounded-lg text-base font-medium text-light-900 dark:text-light-300 hover:bg-light-100 dark:hover:bg-dark-200"
              onClick={() => setShowMobileMenu(false)}
            >
              Trending
            </Link>
            <Link
              to="/interests"
              className="block pl-3 pr-4 py-2 mx-2 rounded-lg text-base font-medium text-light-900 dark:text-light-300 hover:bg-light-100 dark:hover:bg-dark-200"
              onClick={() => setShowMobileMenu(false)}
            >
              Interests
            </Link>
            <Link
              to="/news-sources"
              className="block pl-3 pr-4 py-2 mx-2 rounded-lg text-base font-medium text-light-900 dark:text-light-300 hover:bg-light-100 dark:hover:bg-dark-200"
              onClick={() => setShowMobileMenu(false)}
            >
              News Sources
            </Link>
            <Link
              to="/history"
              className="block pl-3 pr-4 py-2 mx-2 rounded-lg text-base font-medium text-light-900 dark:text-light-300 hover:bg-light-100 dark:hover:bg-dark-200"
              onClick={() => setShowMobileMenu(false)}
            >
              Reading History
            </Link>
            <Link
              to="/profile"
              className="block pl-3 pr-4 py-2 mx-2 rounded-lg text-base font-medium text-light-900 dark:text-light-300 hover:bg-light-100 dark:hover:bg-dark-200"
              onClick={() => setShowMobileMenu(false)}
            >
              Profile
            </Link>
            <button
              className="block w-full text-left pl-3 pr-4 py-2 mx-2 rounded-lg text-base font-medium text-light-900 dark:text-light-300 hover:bg-light-100 dark:hover:bg-dark-200"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};