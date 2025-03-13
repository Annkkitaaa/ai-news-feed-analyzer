import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNewsStore } from '../store';
import { format, parseISO } from 'date-fns';
import { FiClock, FiArrowLeft, FiBookmark, FiShare2, FiExternalLink } from 'react-icons/fi';
import { toast } from 'react-toastify';

export const NewsDetail = () => {
  const { id } = useParams();
  const { currentNews, fetchNewsById, loading } = useNewsStore();
  const [readStartTime, setReadStartTime] = useState(null);
  
  useEffect(() => {
    if (id) {
      fetchNewsById(id);
      // Start tracking read time
      setReadStartTime(Date.now());
    }
    
    // Cleanup - record read time when component unmounts
    return () => {
      if (readStartTime) {
        const durationSeconds = Math.floor((Date.now() - readStartTime) / 1000);
        // Only record if they spent at least 5 seconds on the page
        if (durationSeconds >= 5) {
          // Record read time
          recordReadTime(id, durationSeconds);
        }
      }
    };
  }, [id, fetchNewsById]);
  
  const recordReadTime = (newsId, duration) => {
    // This would call your API to record reading time
    console.log(`User read article ${newsId} for ${duration} seconds`);
  };
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: currentNews?.title,
        url: currentNews?.url,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback
      navigator.clipboard.writeText(currentNews?.url)
        .then(() => toast.success('URL copied to clipboard'))
        .catch((err) => toast.error('Failed to copy URL'));
    }
  };
  
  if (loading || !currentNews) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-200 dark:border-primary-900 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  const formattedDate = currentNews.published_at 
    ? format(parseISO(currentNews.published_at), 'MMMM d, yyyy, h:mm a')
    : 'Publication date unknown';
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
      <div className="mb-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-light-800 dark:text-light-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Back to news feed
        </Link>
      </div>
      
      <div className="glass-card p-6 mb-6">
        <h1 className="text-3xl font-display font-semibold mb-4">{currentNews.title}</h1>
        
        <div className="flex flex-wrap items-center justify-between mb-6">
          <div className="flex items-center text-light-800 dark:text-light-500 text-sm mb-2 sm:mb-0">
            <div className="flex items-center mr-4">
              {currentNews.source && (
                <span className="tag mr-2">{currentNews.source.name}</span>
              )}
              <span>{currentNews.author && `${currentNews.author} • `}{formattedDate}</span>
            </div>
            
            {currentNews.categories && currentNews.categories.length > 0 && (
              <div className="flex items-center">
                {currentNews.categories.map(category => (
                  <span 
                    key={category.id} 
                    className="inline-block bg-light-200 dark:bg-dark-200 rounded-full px-2 py-1 text-xs font-medium text-light-900 dark:text-light-400 mr-1"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex">
            <button
              onClick={() => toast.info('Article saved to bookmarks')}
              className="p-2 rounded-full text-light-800 dark:text-light-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors mr-1"
              title="Bookmark"
            >
              <FiBookmark />
            </button>
            
            <button
              onClick={handleShare}
              className="p-2 rounded-full text-light-800 dark:text-light-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
              title="Share"
            >
              <FiShare2 />
            </button>
          </div>
        </div>
        
        {currentNews.image_url && (
          <div className="mb-6 overflow-hidden rounded-lg">
            <img
              src={currentNews.image_url}
              alt={currentNews.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}
        
        {currentNews.summary && (
          <div className="mb-6 p-4 bg-light-100 dark:bg-dark-200 rounded-lg border-l-4 border-primary-500 dark:border-primary-600">
            <h3 className="font-medium mb-2 text-primary-700 dark:text-primary-400">Summary</h3>
            <p className="text-light-900 dark:text-light-400">{currentNews.summary}</p>
          </div>
        )}
        
        {currentNews.content ? (
          <div className="prose dark:prose-invert prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: currentNews.content }} />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-light-800 dark:text-light-500 mb-4">Full content not available in preview.</p>
            
            <a
              href={currentNews.url}
              target="_blank"
              rel="noopener noreferrer"
              className="primary-button inline-flex items-center"
            >
              Read Full Article <FiExternalLink className="ml-2" />
            </a>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center mt-8">
        <div className="flex items-center text-sm text-light-700 dark:text-light-600">
          <FiClock className="mr-1" />
          <span>Reading time: ~{Math.ceil((currentNews.content?.length || 0) / 1000)} min</span>
        </div>
        
        <a
          href={currentNews.url}
          target="_blank"
          rel="noopener noreferrer"
          className="primary-button inline-flex items-center"
        >
          View Original Article <FiExternalLink className="ml-2" />
        </a>
      </div>
    </div>
  );
};