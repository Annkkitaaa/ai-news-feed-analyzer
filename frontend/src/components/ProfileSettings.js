import React, { useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuthStore } from '../store';
import { toast } from 'react-toastify';
import { FiSave, FiUser, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

export const ProfileSettings = () => {
  const { user, updateProfile, loading, fetchCurrentUser } = useAuthStore();
  
  useEffect(() => {
    if (!user) {
      fetchCurrentUser();
    }
  }, [user, fetchCurrentUser]);
  
  // Profile validation schema
  const profileValidationSchema = Yup.object({
    first_name: Yup.string().required('First name is required'),
    last_name: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    phone: Yup.string(),
    city: Yup.string(),
    country: Yup.string(),
    bio: Yup.string().max(200, 'Bio must be 200 characters or less'),
  });
  
  // Handle profile update
  const handleProfileUpdate = async (values, { setSubmitting }) => {
    try {
      await updateProfile(values);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading && !user) {
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
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
      <h1 className="text-3xl font-display font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 text-transparent bg-clip-text mb-8">
        Profile Settings
      </h1>
      
      <div className="glass-card p-6 mb-8">
        <div className="flex items-center mb-8">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-2xl shadow-md">
            {user?.first_name ? user.first_name[0] : ''}
            {user?.last_name ? user.last_name[0] : ''}
          </div>
          <div className="ml-6">
            <h2 className="text-2xl font-display font-medium">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-light-800 dark:text-light-600">
              {user?.email}
            </p>
          </div>
        </div>
        
        <Formik
          initialValues={{
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            city: user?.city || '',
            country: user?.country || '',
            bio: user?.bio || '',
          }}
          validationSchema={profileValidationSchema}
          onSubmit={handleProfileUpdate}
          enableReinitialize
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                    First Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-light-700 dark:text-light-500" />
                    </div>
                    <Field
                      id="first_name"
                      name="first_name"
                      type="text"
                      className="input pl-10"
                    />
                  </div>
                  <ErrorMessage name="first_name" component="div" className="mt-1 text-red-500 text-xs" />
                </div>
                
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                    Last Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-light-700 dark:text-light-500" />
                    </div>
                    <Field
                      id="last_name"
                      name="last_name"
                      type="text"
                      className="input pl-10"
                    />
                  </div>
                  <ErrorMessage name="last_name" component="div" className="mt-1 text-red-500 text-xs" />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-light-700 dark:text-light-500" />
                    </div>
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      className="input pl-10"
                    />
                  </div>
                  <ErrorMessage name="email" component="div" className="mt-1 text-red-500 text-xs" />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                    Phone (optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiPhone className="h-5 w-5 text-light-700 dark:text-light-500" />
                    </div>
                    <Field
                      id="phone"
                      name="phone"
                      type="text"
                      className="input pl-10"
                    />
                  </div>
                  <ErrorMessage name="phone" component="div" className="mt-1 text-red-500 text-xs" />
                </div>
                
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                    City (optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMapPin className="h-5 w-5 text-light-700 dark:text-light-500" />
                    </div>
                    <Field
                      id="city"
                      name="city"
                      type="text"
                      className="input pl-10"
                    />
                  </div>
                  <ErrorMessage name="city" component="div" className="mt-1 text-red-500 text-xs" />
                </div>
                
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                    Country (optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMapPin className="h-5 w-5 text-light-700 dark:text-light-500" />
                    </div>
                    <Field
                      id="country"
                      name="country"
                      type="text"
                      className="input pl-10"
                    />
                  </div>
                  <ErrorMessage name="country" component="div" className="mt-1 text-red-500 text-xs" />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="bio" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                  Bio (optional)
                </label>
                <Field
                  as="textarea"
                  id="bio"
                  name="bio"
                  rows="4"
                  className="input"
                  placeholder="Tell us a little about yourself"
                />
                <ErrorMessage name="bio" component="div" className="mt-1 text-red-500 text-xs" />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="primary-button inline-flex items-center"
                >
                  <FiSave className="mr-2" />
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
      
      <div className="bg-light-100 dark:bg-dark-200 rounded-lg p-4 text-sm text-light-800 dark:text-light-500">
        <p>
          <strong>Note:</strong> Updating your profile information helps us personalize your news feed and recommendations.
        </p>
      </div>
    </div>
  );
};