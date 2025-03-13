import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-light-300 dark:bg-dark-400">
      <Sidebar />
      <div className="md:ml-64"> {/* Add margin-left to match sidebar width */}
        <Header />
        <main className="animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};