import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNewsStore, useProfileStore, useAuthStore } from '../store';
import { format } from 'date-fns';
import { FiBookmark, FiClock, FiTrendingUp, FiRss, FiSettings, FiUser, FiArrowRight, FiExternalLink } from 'react-icons/fi';

// News Card Component - Modern Design
const NewsCard = ({ article, showSource = true }) => {
  const { recordNewsRead } = useNewsStore();
  
  const handleClick = () => {
    recordNewsRead(article.id);
  };
  
  const formattedDate = article.published_at 
    ? format(new Date(article.published_at), 'MMM d, yyyy')
    : 'N/A';
  
  return (
    <div className="news-card">
      {article.image_url ? (
        <div className="relative overflow-hidden h-48">
          <img 
            src={article.image_url}
            alt={article.title}
            className="news-card-image"
          />
          {showSource && article.source && (
            <div className="absolute top-2 left-2">
              <span className="tag">{article.source.name}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="h-16 bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white">
          {showSource && article.source && (
            <span className="font-medium">{article.source.name}</span>
          )}
        </div>
      )}
      
      <div className="p-5">
        <div className="text-xs text-light-800 dark:text-light-700 mb-2">
          {formattedDate}
        </div>
        
        <h3 className="text-xl font-display font-medium mb-2 line-clamp-2">{article.title}</h3>
        
        <p className="text-light-900 dark:text-light-600 text-sm mb-4 line-clamp-3">
          {article.summary || 'No summary available.'}
        </p>
        
        <a 
          href={article.url} 
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
  
  useEffect(() => {
    fetchPersonalizedFeed();
    fetchTrendingFeed();
    fetchCategories();
  }, [fetchPersonalizedFeed, fetchTrendingFeed, fetchCategories]);
  
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
        <div className="mb-8 glass-card p-6">
          <h1 className="text-3xl font-display font-semibold mb-2 bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 text-transparent bg-clip-text">
            {getGreeting()}, {user?.first_name || 'Reader'}!
          </h1>
          <p className="text-light-900 dark:text-light-600">
            Here's your personalized news feed curated with AI.
          </p>
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
                <svg className="mx-auto h-12 w-12 text-light-700 dark:text-light-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="mt-4 text-light-800 dark:text-light-500">
                  No articles found. Try changing your filters or adding more interests in your{' '}
                  <Link to="/profile" className="text-primary-600 dark:text-primary-400 hover:underline">
                    profile settings
                  </Link>.
                </p>
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