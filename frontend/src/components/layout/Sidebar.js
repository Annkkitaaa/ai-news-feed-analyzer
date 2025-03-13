import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiUser,
  FiBookmark,
  FiRss,
  FiClock,
  FiSettings,
  FiFileText,
  FiTrendingUp,
  FiActivity,
  FiMoon,
  FiSun
} from 'react-icons/fi';
import { useAuthStore } from '../../store';

export const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [darkMode, setDarkMode] = React.useState(
    localStorage.getItem('darkMode') === 'true' || 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  
  // Navigation items
  const navItems = [
    { name: 'Dashboard', icon: FiHome, path: '/dashboard' },
    { name: 'Digest', icon: FiFileText, path: '/digest' }, // This is correct
    { name: 'Trending', icon: FiTrendingUp, path: '/dashboard' }, // Changed from /trends to /dashboard
    { name: 'Interests', icon: FiBookmark, path: '/interests' },
    { name: 'Sources', icon: FiRss, path: '/news-sources' },
    { name: 'History', icon: FiClock, path: '/history' },
    { name: 'Analytics', icon: FiActivity, path: '/dashboard' }, // Changed from /analytics
    { name: 'Profile', icon: FiUser, path: '/profile' },
    { name: 'Settings', icon: FiSettings, path: '/settings' },
  ];
  
  // Check if a nav item is active
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  // Set initial dark mode on mount
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 animate-fade-in">
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-dark-300 border-r border-light-500 dark:border-dark-100">
        <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-6 mb-6">
            <Link to="/dashboard" className="flex items-center">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                  <path d="M12 7.76L4.64 15.11C4.14 15.61 3.25 15.61 2.76 15.11V15.11C2.34 14.7 2.34 14.02 2.76 13.6L11.47 4.89C11.76 4.6 12.24 4.6 12.53 4.89L21.24 13.6C21.66 14.02 21.66 14.7 21.24 15.11V15.11C20.75 15.61 19.86 15.61 19.36 15.11L12 7.76Z" />
                  <path d="M12 12.44L19.04 19.5C19.52 19.97 19.52 20.75 19.04 21.22C18.56 21.69 17.78 21.69 17.3 21.22L12.53 16.43C12.38 16.29 12.15 16.22 11.93 16.22C11.71 16.22 11.49 16.29 11.33 16.43L6.7 21.22C6.22 21.69 5.44 21.69 4.96 21.22C4.48 20.75 4.48 19.97 4.96 19.5L12 12.44Z" />
                </svg>
              </div>
              <span className="ml-2 text-xl font-display font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 text-transparent bg-clip-text">
                NewsFlow
              </span>
            </Link>
          </div>
          
          {/* User Profile Section */}
          <div className="px-6 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-medium text-lg">
                  {user?.first_name ? user.first_name[0] : 'U'}
                </div>
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-light-800 dark:text-light-600 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="mt-4 flex-1 px-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-light-900 dark:text-light-400 hover:bg-light-200 dark:hover:bg-dark-200'
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    isActive(item.path)
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-light-700 dark:text-light-500 group-hover:text-light-900 dark:group-hover:text-light-300'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex-shrink-0 p-4">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg text-light-900 dark:text-light-400 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors duration-200"
          >
            {darkMode ? (
              <>
                <FiSun className="mr-3 h-5 w-5 text-amber-500" />
                Light Mode
              </>
            ) : (
              <>
                <FiMoon className="mr-3 h-5 w-5 text-indigo-600" />
                Dark Mode
              </>
            )}
          </button>
          
          <div className="mt-4 pt-4 border-t border-light-300 dark:border-dark-100">
            <div className="flex items-center">
              <div className="text-xs font-medium text-light-700 dark:text-light-500">
                NewsFlow AI
              </div>
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                v1.0
              </span>
            </div>
            <p className="text-xs text-light-600 dark:text-light-700 mt-1">
              Powered by AI & LangChain
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};