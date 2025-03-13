import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { useProfileStore } from '../store';
import { toast } from 'react-toastify';
import { FiPlus, FiX, FiCheck, FiSearch, FiTag } from 'react-icons/fi';

export const InterestsManagement = () => {
  const { 
    profile, 
    interests,
    fetchProfile,
    fetchAllInterests,
    addInterest,
    removeInterest,
    createInterest,
    loading 
  } = useProfileStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  
  useEffect(() => {
    fetchProfile();
    fetchAllInterests();
  }, [fetchProfile, fetchAllInterests]);
  
  // Create interest form schema
  const interestValidationSchema = Yup.object({
    name: Yup.string().required('Interest name is required'),
    description: Yup.string(),
    keywords: Yup.array().of(Yup.string()),
  });
  
  // Handle creating a new interest
  const handleCreateInterest = async (values, { setSubmitting, resetForm }) => {
    try {
      await createInterest(values);
      toast.success('Interest created successfully');
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create interest');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle adding an interest to user profile
  const handleAddInterest = async (interestId) => {
    try {
      await addInterest(interestId);
      toast.success('Interest added to your profile');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add interest');
    }
  };
  
  // Handle removing an interest from user profile
  const handleRemoveInterest = async (interestId) => {
    try {
      await removeInterest(interestId);
      toast.success('Interest removed from your profile');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to remove interest');
    }
  };
  
  // Filter interests based on search term
  const filteredInterests = interests.filter(interest => 
    interest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (interest.description && interest.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Check if user has a specific interest
  const hasInterest = (interestId) => {
    return profile?.interests?.some(interest => interest.id === interestId);
  };
  
  if (loading && !profile && !interests.length) {
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
      <div className="mb-8">
        <h1 className="text-3xl font-display font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 text-transparent bg-clip-text mb-6">
          Manage Your Interests
        </h1>
        
        <p className="text-gray-600 mb-4">
          Select topics you're interested in to customize your news feed. 
          The more specific your interests, the more relevant your news will be.
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
              placeholder="Search interests..."
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
                <FiPlus className="mr-2" /> Add New Interest
              </>
            )}
          </button>
        </div>
        
        {/* Add New Interest Form */}
        {showAddForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Create New Interest</h2>
            
            <Formik
              initialValues={{
                name: '',
                description: '',
                keywords: [''],
              }}
              validationSchema={interestValidationSchema}
              onSubmit={handleCreateInterest}
            >
              {({ isSubmitting, values }) => (
                <Form>
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Interest Name
                    </label>
                    <Field
                      type="text"
                      name="name"
                      id="name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Blockchain, AI, Finance"
                    />
                    <ErrorMessage name="name" component="div" className="mt-1 text-red-500 text-sm" />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optional)
                    </label>
                    <Field
                      as="textarea"
                      name="description"
                      id="description"
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Briefly describe this interest..."
                    />
                    <ErrorMessage name="description" component="div" className="mt-1 text-red-500 text-sm" />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Keywords (optional)
                    </label>
                    <p className="text-sm text-gray-500 mb-2">
                      Add related keywords to improve matching with relevant news.
                    </p>
                    
                    <FieldArray name="keywords">
                      {({ push, remove }) => (
                        <div>
                          {values.keywords.map((keyword, index) => (
                            <div key={index} className="flex mb-2">
                              <div className="flex-grow mr-2">
                                <Field
                                  name={`keywords.${index}`}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder={`Keyword ${index + 1}`}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="px-2 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                              >
                                <FiX />
                              </button>
                            </div>
                          ))}
                          
                          <button
                            type="button"
                            onClick={() => push('')}
                            className="mt-2 flex items-center px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800"
                          >
                            <FiPlus className="mr-1" /> Add Keyword
                          </button>
                        </div>
                      )}
                    </FieldArray>
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
                      {isSubmitting ? 'Creating...' : 'Create Interest'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        )}
        
        {/* Interests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInterests.length > 0 ? (
            filteredInterests.map((interest) => {
              const isActive = hasInterest(interest.id);
              
              return (
                <div 
                  key={interest.id} 
                  className={`border rounded-lg p-4 transition-colors ${
                    isActive 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-900">{interest.name}</h3>
                    <button
                      onClick={() => isActive ? handleRemoveInterest(interest.id) : handleAddInterest(interest.id)}
                      className={`p-2 rounded-full ${
                        isActive 
                          ? 'bg-indigo-500 text-white hover:bg-indigo-600' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {isActive ? <FiCheck /> : <FiPlus />}
                    </button>
                  </div>
                  
                  {interest.description && (
                    <p className="text-gray-600 text-sm mb-3">{interest.description}</p>
                  )}
                  
                  {interest.keywords && interest.keywords.length > 0 && (
                    <div className="flex flex-wrap mt-2">
                      {interest.keywords.map((keyword, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-2 mb-2"
                        >
                          <FiTag className="mr-1" size={12} />
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">
                {searchTerm 
                  ? `No interests found matching "${searchTerm}"`
                  : 'No interests available. Create a new interest to get started.'}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Your Current Interests */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Your Selected Interests</h2>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {profile?.interests && profile.interests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.interests.map((interest) => (
                <div key={interest.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <h3 className="font-medium">{interest.name}</h3>
                  </div>
                  <button
                    onClick={() => handleRemoveInterest(interest.id)}
                    className="p-1 text-gray-500 hover:text-red-500"
                    title="Remove interest"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              You haven't selected any interests yet. Add some interests above to customize your news feed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};