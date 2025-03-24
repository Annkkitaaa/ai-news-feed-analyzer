import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNewsStore, useProfileStore, useAuthStore } from '../store';
import { format } from 'date-fns';
import { FiBookmark, FiClock, FiTrendingUp, FiRss, FiSettings, FiUser, FiArrowRight, FiExternalLink, FiRefreshCw, FiInbox } from 'react-icons/fi';
import api from '../services/api';
import { toast } from 'react-toastify';

// News Card Component - Modern Design
const NewsCard = ({ article, showSource = true }) => {
  const { recordNewsRead } = useNewsStore();
  
  const handleClick = () => {
    if (article && article.id) {
      recordNewsRead(article.id);
    }
  };
  
  // Add fallbacks for missing fields
  const title = article?.title || 'No title';
  const summary = article?.summary || 'No summary available.';
  const imageUrl = article?.image_url || 'https://via.placeholder.com/800x400?text=No+Image';
  const sourceName = article?.source?.name || 'Unknown Source';
  
  // Safe date formatting
  let formattedDate = 'Unknown date';
  try {
    if (article?.published_at) {
      formattedDate = format(new Date(article.published_at), 'MMM d, yyyy');
    }
  } catch (e) {
    console.error('Date formatting error:', e);
  }
  
  return (
    <div className="news-card">
      <div className="relative overflow-hidden h-48">
        <img 
          src={imageUrl}
          alt={title}
          className="news-card-image"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/800x400?text=Image+Not+Available';
          }}
        />
        {showSource && (
          <div className="absolute top-2 left-2">
            <span className="tag">{sourceName}</span>
          </div>
        )}
      </div>
      
      <div className="p-5">
        <div className="text-xs text-light-800 dark:text-light-700 mb-2">
          {formattedDate}
        </div>
        
        <h3 className="text-xl font-display font-medium mb-2 line-clamp-2">{title}</h3>
        
        <p className="text-light-900 dark:text-light-600 text-sm mb-4 line-clamp-3">
          {summary}
        </p>
        
        <a 
          href={article?.url || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={handleClick}
          className="flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors duration-200"
        >
          Read full article
          <FiExternalLink className="ml-1 h-4 w-4" />
        </a>
      </div>
    </div>
  );
};

// Category Badge Component
const CategoryBadge = ({ category, isActive, onClick }) => {
  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-medium mr-2 mb-2 transition-all duration-200 ${
        isActive 
          ? 'bg-primary-600 text-white shadow-md' 
          : 'bg-light-400 dark:bg-dark-200 text-dark-400 dark:text-light-400 hover:bg-light-500 dark:hover:bg-dark-100'
      }`}
      onClick={() => onClick(category)}
    >
      {category}
    </button>
  );
};

// Dashboard Component
export const Dashboard = () => {
  const { user } = useAuthStore();
  const { 
    personalizedFeed,
    trendingFeed,
    categories,
    fetchPersonalizedFeed,
    fetchTrendingFeed,
    fetchCategories,
    loading 
  } = useNewsStore();
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [displayedFeed, setDisplayedFeed] = useState('personalized');
  const [isFetching, setIsFetching] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [apiStatus, setApiStatus] = useState({});
  
  useEffect(() => {
    fetchPersonalizedFeed();
    fetchTrendingFeed();
    fetchCategories();
  }, [fetchPersonalizedFeed, fetchTrendingFeed, fetchCategories]);
  
  useEffect(() => {
    if (debugMode) {
      // Test various endpoints
      const checkEndpoints = async () => {
        const results = {};
        
        try {
          // Test personalized feed
          const personalResp = await api.get('/news/personalized/feed');
          results.personalized = {
            status: 'success',
            count: personalResp.data.length,
            sample: personalResp.data.slice(0, 1)
          };
        } catch (err) {
          results.personalized = { status: 'error', message: err.message };
        }
        
        try {
          // Test trending feed
          const trendingResp = await api.get('/news/trending/feed');
          results.trending = {
            status: 'success',
            count: trendingResp.data.length,
            sample: trendingResp.data.slice(0, 1)
          };
        } catch (err) {
          results.trending = { status: 'error', message: err.message };
        }
        
        try {
          // Test categories
          const catResp = await api.get('/news/categories/list');
          results.categories = {
            status: 'success',
            count: catResp.data.length,
            sample: catResp.data.slice(0, 1)
          };
        } catch (err) {
          results.categories = { status: 'error', message: err.message };
        }
        
        setApiStatus(results);
      };
      
      checkEndpoints();
    }
  }, [debugMode]);
  
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    if (category === 'All') {
      if (displayedFeed === 'personalized') {
        fetchPersonalizedFeed();
      } else {
        fetchTrendingFeed();
      }
    } else {
      fetchTrendingFeed(category);
      setDisplayedFeed('trending');
    }
  };
  
  const handleFeedToggle = (feed) => {
    setDisplayedFeed(feed);
    if (feed === 'personalized') {
      setSelectedCategory('All');
      fetchPersonalizedFeed();
    } else {
      fetchTrendingFeed(selectedCategory !== 'All' ? selectedCategory : null);
    }
  };
  
  const handleFetchNews = async () => {
    try {
      setIsFetching(true);
      // Call the manual fetch endpoint
      const response = await api.post('/news/fetch');
      toast.success('News articles fetched successfully');
      
      // Refresh the feeds
      fetchPersonalizedFeed();
      fetchTrendingFeed();
      fetchCategories();
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Failed to fetch news');
    } finally {
      setIsFetching(false);
    }
  };
  
  const displayFeed = displayedFeed === 'personalized' ? personalizedFeed : trendingFeed;
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  return (
    <div className="min-h-screen bg-mesh-pattern bg-light-300 dark:bg-dark-400 animate-fade-in">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-display font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 text-transparent bg-clip-text mb-4 md:mb-0">
            {getGreeting()}, {user?.first_name || 'Reader'}!
          </h1>
          
          <button
            onClick={handleFetchNews}
            disabled={isFetching}
            className="primary-button flex items-center"
          >
            {isFetching ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Fetching News...
              </>
            ) : (
              <>
                <FiRefreshCw className="mr-2" />
                Fetch News
              </>
            )}
          </button>
        </div>
        
        <div className="mb-8 glass-card p-6">
          <p className="text-light-900 dark:text-light-600">
            Here's your personalized news feed curated with AI.
          </p>
          
          <div className="mt-4 text-right">
            <button
              onClick={() => setDebugMode(!debugMode)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              {debugMode ? 'Hide Debug' : 'Debug Mode'}
            </button>
          </div>
          
          {debugMode && (
            <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-mono">
              <h3 className="font-bold mb-2">API Status:</h3>
              <pre>{JSON.stringify(apiStatus, null, 2)}</pre>
            </div>
          )}
        </div>
        
        {/* Feed Toggle */}
        <div className="flex mb-6 bg-light-200 dark:bg-dark-300 p-1 rounded-lg inline-block">
          <button
            className={`py-2 px-4 font-medium rounded-md transition-all duration-200 ${
              displayedFeed === 'personalized' 
                ? 'bg-white dark:bg-dark-200 text-primary-600 dark:text-primary-400 shadow-sm' 
                : 'text-dark-300 dark:text-light-600 hover:text-dark-400 dark:hover:text-light-400'
            }`}
            onClick={() => handleFeedToggle('personalized')}
          >
            <FiRss className="inline mr-2" />
            Personalized
          </button>
          <button
            className={`py-2 px-4 font-medium rounded-md transition-all duration-200 ${
              displayedFeed === 'trending' 
                ? 'bg-white dark:bg-dark-200 text-primary-600 dark:text-primary-400 shadow-sm' 
                : 'text-dark-300 dark:text-light-600 hover:text-dark-400 dark:hover:text-light-400'
            }`}
            onClick={() => handleFeedToggle('trending')}
          >
            <FiTrendingUp className="inline mr-2" />
            Trending
          </button>
        </div>
        
        {/* Categories */}
        <div className="mb-8 overflow-x-auto whitespace-nowrap pb-2">
          <div className="inline-flex">
            <CategoryBadge
              category="All"
              isActive={selectedCategory === 'All'}
              onClick={handleCategorySelect}
            />
            {categories.map((category) => (
              <CategoryBadge
                key={category.id}
                category={category.name}
                isActive={selectedCategory === category.name}
                onClick={handleCategorySelect}
              />
            ))}
          </div>
        </div>
        
        {/* News Feed */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="relative w-16 h-16">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-200 dark:border-primary-900 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayFeed.length > 0 ? (
              displayFeed.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))
            ) : (
              <div className="col-span-full glass-card p-8 text-center">
                <div className="mx-auto h-16 w-16 mb-4 flex items-center justify-center rounded-full bg-light-200 dark:bg-dark-200">
                  <FiInbox className="h-8 w-8 text-light-700 dark:text-light-600" />
                </div>
                <h2 className="text-xl font-medium mb-4">No Articles Found</h2>
                <p className="text-light-800 dark:text-light-500 mb-6">
                  Try fetching news with the button above, or adding more interests in your profile settings.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={handleFetchNews}
                    disabled={isFetching}
                    className="primary-button flex items-center"
                  >
                    <FiRefreshCw className="mr-2" />
                    Fetch News
                  </button>
                  <Link to="/interests" className="secondary-button flex items-center">
                    <FiBookmark className="mr-2" />
                    Manage Interests
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Quick Links */}
        <div className="mt-12 glass-card p-6">
          <h2 className="text-xl font-display font-semibold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/profile" className="card group p-4 flex flex-col items-center text-center hover:border-primary-400 transition-all">
              <div className="w-12 h-12 mb-2 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                <FiUser className="text-xl" />
              </div>
              <span className="font-medium">Profile</span>
            </Link>
            <Link to="/interests" className="card group p-4 flex flex-col items-center text-center hover:border-primary-400 transition-all">
              <div className="w-12 h-12 mb-2 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                <FiBookmark className="text-xl" />
              </div>
              <span className="font-medium">Interests</span>
            </Link>
            <Link to="/history" className="card group p-4 flex flex-col items-center text-center hover:border-primary-400 transition-all">
              <div className="w-12 h-12 mb-2 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                <FiClock className="text-xl" />
              </div>
              <span className="font-medium">History</span>
            </Link>
            <Link to="/settings" className="card group p-4 flex flex-col items-center text-center hover:border-primary-400 transition-all">
              <div className="w-12 h-12 mb-2 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                <FiSettings className="text-xl" />
              </div>
              <span className="font-medium">Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};