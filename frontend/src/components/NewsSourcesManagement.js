import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useProfileStore } from '../store';
import { toast } from 'react-toastify';
import { FiPlus, FiX, FiCheck, FiSearch, FiGlobe, FiRss, FiDatabase } from 'react-icons/fi';

export const NewsSourcesManagement = () => {
  const { 
    profile, 
    newsSources,
    fetchProfile,
    fetchAllNewsSources,
    addNewsSource,
    removeNewsSource,
    createNewsSource,
    loading 
  } = useProfileStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  
  useEffect(() => {
    fetchProfile();
    fetchAllNewsSources();
  }, [fetchProfile, fetchAllNewsSources]);
  
  // Create news source form schema
  const sourceValidationSchema = Yup.object({
    name: Yup.string().required('Source name is required'),
    url: Yup.string().url('Enter a valid URL').required('URL is required'),
    source_type: Yup.string()
      .oneOf(['rss', 'api', 'scraped'], 'Invalid source type')
      .required('Source type is required'),
  });
  
  // Handle creating a new news source
  const handleCreateSource = async (values, { setSubmitting, resetForm }) => {
    try {
      // Add default config if not provided
      const sourceData = {
        ...values,
        config: values.config ? JSON.parse(values.config) : {},
      };
      
      await createNewsSource(sourceData);
      toast.success('News source created successfully');
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create news source');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle adding a news source to user profile
  const handleAddSource = async (sourceId) => {
    try {
      await addNewsSource(sourceId);
      toast.success('News source added to your profile');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add news source');
    }
  };
  
  // Handle removing a news source from user profile
  const handleRemoveSource = async (sourceId) => {
    try {
      await removeNewsSource(sourceId);
      toast.success('News source removed from your profile');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to remove news source');
    }
  };
  
  // Filter sources based on search term
  const filteredSources = newsSources.filter(source => 
    source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    source.url.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Check if user has a specific source
  const hasSource = (sourceId) => {
    return profile?.news_sources?.some(source => source.id === sourceId);
  };
  
  // Get icon for source type
  const getSourceTypeIcon = (type) => {
    switch (type) {
      case 'rss':
        return <FiRss />;
      case 'api':
        return <FiDatabase />;
      case 'scraped':
        return <FiGlobe />;
      default:
        return <FiRss />;
    }
  };
  
  // Get readable name for source type
  const getSourceTypeName = (type) => {
    switch (type) {
      case 'rss':
        return 'RSS Feed';
      case 'api':
        return 'API';
      case 'scraped':
        return 'Web Scraping';
      default:
        return type;
    }
  };
  
  if (loading && !profile && !newsSources.length) {
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 text-transparent bg-clip-text mb-6">
        Manage News Sources
      </h1>
      
      <div className="mb-8">
        <p className="text-gray-600 mb-4">
          Select news sources to customize where your news comes from.
          You can add existing sources or create new ones.
        </p>
        
        {/* Search and Add New Button */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search news sources..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {showAddForm ? (
              <>
                <FiX className="mr-2" /> Cancel
              </>
            ) : (
              <>
                <FiPlus className="mr-2" /> Add New Source
              </>
            )}
          </button>
        </div>
        
        {/* Add New Source Form */}
        {showAddForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Add New News Source</h2>
            
            <Formik
              initialValues={{
                name: '',
                url: '',
                source_type: 'rss',
                config: '',
                is_active: true,
              }}
              validationSchema={sourceValidationSchema}
              onSubmit={handleCreateSource}
            >
              {({ isSubmitting, values }) => (
                <Form>
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Source Name
                    </label>
                    <Field
                      type="text"
                      name="name"
                      id="name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., TechCrunch, BBC News"
                    />
                    <ErrorMessage name="name" component="div" className="mt-1 text-red-500 text-sm" />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                      URL
                    </label>
                    <Field
                      type="text"
                      name="url"
                      id="url"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://example.com/feed"
                    />
                    <ErrorMessage name="url" component="div" className="mt-1 text-red-500 text-sm" />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source Type
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                        <Field
                          type="radio"
                          name="source_type"
                          value="rss"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="ml-2 flex items-center">
                          <FiRss className="mr-1" /> RSS Feed
                        </span>
                      </label>
                      
                      <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                        <Field
                          type="radio"
                          name="source_type"
                          value="api"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="ml-2 flex items-center">
                          <FiDatabase className="mr-1" /> API
                        </span>
                      </label>
                      
                      <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                        <Field
                          type="radio"
                          name="source_type"
                          value="scraped"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="ml-2 flex items-center">
                          <FiGlobe className="mr-1" /> Web Scraping
                        </span>
                      </label>
                    </div>
                    <ErrorMessage name="source_type" component="div" className="mt-1 text-red-500 text-sm" />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="config" className="block text-sm font-medium text-gray-700 mb-1">
                      Config (optional JSON)
                    </label>
                    <Field
                      as="textarea"
                      name="config"
                      id="config"
                      rows="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={'{\n  "key": "value"\n}'}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      For API and scraping sources, you can provide configuration in JSON format.
                    </p>
                    <ErrorMessage name="config" component="div" className="mt-1 text-red-500 text-sm" />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Source'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        )}
        
        {/* Sources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSources.length > 0 ? (
            filteredSources.map((source) => {
              const isActive = hasSource(source.id);
              
              return (
                <div 
                  key={source.id} 
                  className={`border rounded-lg p-4 transition-colors ${
                    isActive 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{source.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        {getSourceTypeIcon(source.source_type)}
                        <span className="ml-1">{getSourceTypeName(source.source_type)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => isActive ? handleRemoveSource(source.id) : handleAddSource(source.id)}
                      className={`p-2 rounded-full ${
                        isActive 
                          ? 'bg-indigo-500 text-white hover:bg-indigo-600' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {isActive ? <FiCheck /> : <FiPlus />}
                    </button>
                  </div>
                  
                  <div className="text-sm mb-3 break-all">
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {source.url}
                    </a>
                  </div>
                  
                  {!source.is_active && (
                    <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mt-2 inline-block">
                      Inactive
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">
                {searchTerm 
                  ? `No sources found matching "${searchTerm}"`
                  : 'No news sources available. Create a new source to get started.'}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Your Selected Sources */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Your Selected News Sources</h2>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {profile?.news_sources && profile.news_sources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.news_sources.map((source) => (
                <div key={source.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <h3 className="font-medium">{source.name}</h3>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      {getSourceTypeIcon(source.source_type)}
                      <span className="ml-1">{getSourceTypeName(source.source_type)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveSource(source.id)}
                    className="p-1 text-gray-500 hover:text-red-500"
                    title="Remove source"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              You haven't selected any news sources yet. Add some sources above to customize your news feed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};