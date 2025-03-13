import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white dark:bg-dark-300 border-t border-light-500 dark:border-dark-100 pt-4 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:order-2 space-x-6">
            <Link to="/terms" className="text-sm text-light-700 dark:text-light-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-sm text-light-700 dark:text-light-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Privacy Policy
            </Link>
            <a href="mailto:support@newsflow.ai" className="text-sm text-light-700 dark:text-light-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Contact
            </a>
          </div>
          <div className="mt-8 md:mt-0 md:order-1 flex items-center justify-center md:justify-start">
            <div className="flex items-center">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                  <path d="M12 7.76L4.64 15.11C4.14 15.61 3.25 15.61 2.76 15.11V15.11C2.34 14.7 2.34 14.02 2.76 13.6L11.47 4.89C11.76 4.6 12.24 4.6 12.53 4.89L21.24 13.6C21.66 14.02 21.66 14.7 21.24 15.11V15.11C20.75 15.61 19.86 15.61 19.36 15.11L12 7.76Z" />
                  <path d="M12 12.44L19.04 19.5C19.52 19.97 19.52 20.75 19.04 21.22C18.56 21.69 17.78 21.69 17.3 21.22L12.53 16.43C12.38 16.29 12.15 16.22 11.93 16.22C11.71 16.22 11.49 16.29 11.33 16.43L6.7 21.22C6.22 21.69 5.44 21.69 4.96 21.22C4.48 20.75 4.48 19.97 4.96 19.5L12 12.44Z" />
                </svg>
              </div>
              <p className="ml-2 text-sm text-light-700 dark:text-light-600">
                &copy; {currentYear} NewsFlow AI. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};