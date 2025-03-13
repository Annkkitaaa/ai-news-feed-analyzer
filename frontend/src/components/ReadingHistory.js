import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfileStore } from '../store';
import { format, parseISO } from 'date-fns';
import { FiTrash2, FiExternalLink, FiClock, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-toastify';

export const ReadingHistory = () => {
  const { readHistory, fetchReadHistory, clearReadHistory, loading } = useProfileStore();
  const [groupedHistory, setGroupedHistory] = useState({});
  
  useEffect(() => {
    fetchReadHistory();
  }, [fetchReadHistory]);
  
  useEffect(() => {
    if (readHistory.length > 0) {
      // Group by date
      const grouped = readHistory.reduce((acc, item) => {
        const date = item.timestamp ? format(parseISO(item.timestamp), 'yyyy-MM-dd') : 'Unknown';
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(item);
        return acc;
      }, {});
      
      setGroupedHistory(grouped);
    }
  }, [readHistory]);
  
  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your reading history? This action cannot be undone.')) {
      try {
        await clearReadHistory();
        toast.success('Reading history cleared successfully');
      } catch (error) {
        toast.error('Failed to clear reading history');
      }
    }
  };
  
  const formatReadingDate = (dateStr) => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'EEEE, MMMM d, yyyy');
    } catch (e) {
      return 'Unknown date';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-200 dark:border-primary-900 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 text-transparent bg-clip-text">
          Reading History
        </h1>
        
        {readHistory.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
          >
            <FiTrash2 className="mr-2" />
            Clear History
          </button>
        )}
      </div>
      
      {readHistory.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <FiClock className="mx-auto h-12 w-12 text-light-700 dark:text-light-600 mb-4" />
          <h2 className="text-xl font-medium mb-2">No reading history yet</h2>
          <p className="text-light-800 dark:text-light-500 mb-6">
            Articles you read will appear here so you can easily find them again.
          </p>
          <Link
            to="/dashboard"
            className="primary-button inline-flex items-center"
          >
            Browse News Feed
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedHistory).map(([date, items]) => (
            <div key={date} className="glass-card p-6">
              <div className="flex items-center mb-4 text-primary-600 dark:text-primary-400">
                <FiCalendar className="mr-2" />
                <h2 className="text-lg font-medium">{formatReadingDate(items[0].timestamp)}</h2>
              </div>
              
              <div className="divide-y divide-light-300 dark:divide-dark-100">
                {items.map((item) => (
                  <div key={item.news_id} className="py-4">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-lg mb-1">{item.news_title}</h3>
                      <span className="text-sm text-light-700 dark:text-light-600">
                        {item.timestamp ? format(parseISO(item.timestamp), 'h:mm a') : ''}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center text-sm text-light-700 dark:text-light-600">
                        <FiClock className="mr-1" />
                        <span>
                          {item.duration_seconds 
                            ? `Read for ${Math.floor(item.duration_seconds / 60)}m ${item.duration_seconds % 60}s` 
                            : 'Visited'}
                        </span>
                      </div>
                      
                      <a 
                        href={item.news_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
                      >
                        Read again
                        <FiExternalLink className="ml-1" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};