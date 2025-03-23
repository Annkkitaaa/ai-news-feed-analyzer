import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { format } from 'date-fns';
import { FiTrendingUp, FiClock, FiBarChart2 } from 'react-icons/fi';

const Analytics = () => {
  const [trendAnalysis, setTrendAnalysis] = useState(null);
  const [readHistory, setReadHistory] = useState([]);
  const [timeframe, setTimeframe] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories first
        const categoriesResponse = await api.get('/news/categories/list');
        setCategories(categoriesResponse.data || []);
        
        // Fetch trend analysis
        const trendResponse = await api.get(`/news/trends/analysis?days=${timeframe}${category ? `&category=${category}` : ''}`);
        setTrendAnalysis(trendResponse.data);
        
        // Fetch read history
        const historyResponse = await api.get('/profiles/read-history');
        setReadHistory(historyResponse.data || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe, category]);

  const handleTimeframeChange = (days) => {
    setTimeframe(days);
  };
  
  const handleCategoryChange = (cat) => {
    setCategory(cat);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-200 dark:border-primary-900 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="glass-card p-6 text-center">
          <h2 className="text-2xl font-display font-semibold mb-4">Error</h2>
          <p className="text-light-900 dark:text-light-600">{error}</p>
        </div>
      </div>
    );
  }

  // Group read history by day
  const groupedHistory = readHistory.reduce((acc, item) => {
    const date = new Date(item.timestamp).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  // Calculate reading stats
  const readingStats = {
    totalArticles: readHistory.length,
    totalTime: readHistory.reduce((sum, item) => sum + (item.duration_seconds || 0), 0),
    averageTimePerArticle: readHistory.length 
      ? Math.round(readHistory.reduce((sum, item) => sum + (item.duration_seconds || 0), 0) / readHistory.length) 
      : 0
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="glass-card p-6 mb-8">
        <h1 className="text-3xl font-display font-semibold mb-2 bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 text-transparent bg-clip-text">
          News Analytics
        </h1>
        <p className="text-light-900 dark:text-light-600">
          Insights and trends from your news consumption.
        </p>
      </div>

      {/* Reading Stats */}
      <div className="glass-card p-6 mb-8">
        <h2 className="text-2xl font-display font-semibold mb-4 flex items-center">
          <FiBarChart2 className="mr-2" /> Reading Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {readingStats.totalArticles}
            </div>
            <div className="text-light-800 dark:text-light-600">
              Articles Read
            </div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {Math.floor(readingStats.totalTime / 60)}m
            </div>
            <div className="text-light-800 dark:text-light-600">
              Total Reading Time
            </div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {Math.floor(readingStats.averageTimePerArticle / 60)}m {readingStats.averageTimePerArticle % 60}s
            </div>
            <div className="text-light-800 dark:text-light-600">
              Avg. Time per Article
            </div>
          </div>
        </div>
      </div>

      {/* Trend Analysis Section */}
      <div className="glass-card p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-display font-semibold flex items-center">
            <FiTrendingUp className="mr-2" /> Trend Analysis
          </h2>
          <div className="flex flex-wrap gap-2">
            <div className="mb-2 mr-4">
              <label className="block text-sm text-light-800 dark:text-light-600 mb-1">
                Category
              </label>
              <select
                value={category || ''}
                onChange={(e) => handleCategoryChange(e.target.value || null)}
                className="px-3 py-1 rounded-md text-sm bg-light-200 dark:bg-dark-300 text-light-900 dark:text-light-600 border border-light-300 dark:border-dark-200"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-light-800 dark:text-light-600 mb-1">
                Timeframe
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleTimeframeChange(7)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    timeframe === 7
                      ? 'bg-primary-600 text-white'
                      : 'bg-light-200 dark:bg-dark-300 text-light-900 dark:text-light-600'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => handleTimeframeChange(14)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    timeframe === 14
                      ? 'bg-primary-600 text-white'
                      : 'bg-light-200 dark:bg-dark-300 text-light-900 dark:text-light-600'
                  }`}
                >
                  14 Days
                </button>
                <button
                  onClick={() => handleTimeframeChange(30)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    timeframe === 30
                      ? 'bg-primary-600 text-white'
                      : 'bg-light-200 dark:bg-dark-300 text-light-900 dark:text-light-600'
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>
          </div>
        </div>

        {trendAnalysis ? (
          <div className="card p-6">
            <div className="text-sm text-light-800 dark:text-light-700 mb-2">
              Generated: {format(new Date(trendAnalysis.generated_at), 'MMM d, yyyy')} • 
              {category ? ` Category: ${category} • ` : ' '} 
              Timeframe: {trendAnalysis.days} days
            </div>
            <p className="text-light-900 dark:text-light-600 whitespace-pre-line text-lg">
              {trendAnalysis.analysis}
            </p>
          </div>
        ) : (
          <div className="text-center p-4">
            <p>No trend analysis available</p>
          </div>
        )}
      </div>

      {/* Reading History Section */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-display font-semibold mb-4 flex items-center">
          <FiClock className="mr-2" /> Reading History
        </h2>

        {readHistory && readHistory.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedHistory).map(([date, items]) => (
              <div key={date} className="mb-4">
                <h3 className="text-lg font-medium mb-2">{format(new Date(date), 'EEEE, MMMM d, yyyy')}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-light-300 dark:border-dark-200">
                        <th className="text-left py-2 px-4">Article</th>
                        <th className="text-left py-2 px-4">Time</th>
                        <th className="text-left py-2 px-4">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={`${item.news_id}-${item.timestamp}`}
                          className="border-b border-light-300 dark:border-dark-200 hover:bg-light-200 dark:hover:bg-dark-300 transition-colors"
                        >
                          <td className="py-3 px-4">
                            
                              href={item.news_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 dark:text-primary-400 hover:underline"
                            >
                              {item.news_title}
                            </a>
                          </td>
                          <td className="py-3 px-4">
                            {format(new Date(item.timestamp), 'h:mm a')}
                          </td>
                          <td className="py-3 px-4">
                            {item.duration_seconds
                              ? `${Math.floor(item.duration_seconds / 60)}m ${item.duration_seconds % 60}s`
                              : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-4">
            <p>No reading history available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;