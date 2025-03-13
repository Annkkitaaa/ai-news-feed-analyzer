import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNewsStore, useSubscriptionStore } from '../store';
import { format, parseISO } from 'date-fns';
import { FiMail, FiExternalLink, FiRefreshCw, FiZap, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-toastify';

export const NewsDigest = () => {
  const { newsDigest, fetchNewsDigest, loading, error } = useNewsStore();
  const { sendManualDigest, loading: sendingDigest } = useSubscriptionStore();
  const [timeframe, setTimeframe] = useState('daily');
  
  useEffect(() => {
    // Fetch digest on component mount and when timeframe changes
    const fetchData = async () => {
      try {
        await fetchNewsDigest(timeframe);
      } catch (error) {
        console.error("Error fetching digest:", error);
      }
    };
    
    fetchData();
  }, [fetchNewsDigest, timeframe]);
  
  const handleRefresh = () => {
    fetchNewsDigest(timeframe)
      .then(() => toast.success(`Refreshing ${timeframe} digest`))
      .catch(err => toast.error(`Failed to refresh digest: ${err.message}`));
  };
  
  const handleSendEmail = async () => {
    try {
      await sendManualDigest(timeframe);
      toast.success(`${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} digest email sent successfully`);
    } catch (error) {
      toast.error('Failed to send digest email');
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return '';
    }
  };
  
  if (loading && !newsDigest) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-200 dark:border-primary-900 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  // Show error message if there's an error
  if (error && !loading && !newsDigest) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-medium mb-2">Error Loading Digest</h2>
        <p className="text-light-800 dark:text-light-500 mb-6">
          {typeof error === 'string' ? error : 'Failed to load digest. Please try again.'}
        </p>
        <button
          onClick={handleRefresh}
          className="primary-button inline-flex items-center"
        >
          <FiRefreshCw className="mr-2" />
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-display font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 text-transparent bg-clip-text mb-4 md:mb-0">
          Your News Digest
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setTimeframe('daily')}
              className={`relative inline-flex items-center px-4 py-2 rounded-l-lg text-sm font-medium focus:z-10 focus:outline-none ${
                timeframe === 'daily'
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-white dark:bg-dark-200 text-light-900 dark:text-light-300 hover:bg-light-100 dark:hover:bg-dark-100'
              }`}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('weekly')}
              className={`relative -ml-px inline-flex items-center px-4 py-2 rounded-r-lg text-sm font-medium focus:z-10 focus:outline-none ${
                timeframe === 'weekly'
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-white dark:bg-dark-200 text-light-900 dark:text-light-300 hover:bg-light-100 dark:hover:bg-dark-100'
              }`}
            >
              Weekly
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="secondary-button inline-flex items-center"
            >
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={handleSendEmail}
              disabled={sendingDigest}
              className="primary-button inline-flex items-center"
            >
              <FiMail className="mr-2" />
              {sendingDigest ? 'Sending...' : 'Email Digest'}
            </button>
          </div>
        </div>
      </div>
      
      {newsDigest && newsDigest.overview && Object.keys(newsDigest.overview).length > 0 ? (
        <div className="space-y-8">
          {/* Digest Overview */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-medium mb-4 flex items-center">
              <FiZap className="mr-2 text-amber-500" /> 
              Overview {newsDigest.timestamp && `- ${formatDate(newsDigest.timestamp)}`}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {newsDigest.overview && Object.entries(newsDigest.overview).map(([category, summary]) => (
                <div key={category} className="card p-4">
                  <h3 className="font-medium text-lg mb-2 text-primary-700 dark:text-primary-400">{category}</h3>
                  <p className="text-light-900 dark:text-light-400 text-sm">{summary}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Top Stories */}
          {newsDigest.top_stories && newsDigest.top_stories.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-xl font-medium mb-4">Top Stories</h2>
              
              <div className="space-y-6">
                {newsDigest.top_stories.map((story) => (
                  <div key={story.id} className="card p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-lg mb-1">{story.title}</h3>
                    <div className="text-xs text-light-700 dark:text-light-600 mb-2">
                      {story.source} • {formatDate(story.published_at)}
                    </div>
                    <p className="text-light-900 dark:text-light-400 text-sm mb-3">{story.summary}</p>
                    <a 
                      href={story.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
                    >
                      Read full article <FiExternalLink className="ml-1" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <FiMail className="mx-auto h-12 w-12 text-light-700 dark:text-light-600 mb-4" />
          <h2 className="text-xl font-medium mb-2">No digest available</h2>
          <p className="text-light-800 dark:text-light-500 mb-6">
            We couldn't find a {timeframe} digest for you. Try refreshing or changing your interests in your profile.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleRefresh}
              className="primary-button inline-flex items-center"
            >
              <FiRefreshCw className="mr-2" />
              Refresh Digest
            </button>
            
            <Link
              to="/interests"
              className="secondary-button inline-flex items-center"
            >
              Manage Interests <FiArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};