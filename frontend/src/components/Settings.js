import React, { useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuthStore, useSubscriptionStore } from '../store';
import { toast } from 'react-toastify';
import { FiSave, FiMail, FiSliders, FiLock, FiUser, FiBell } from 'react-icons/fi';

export const Settings = () => {
  const { user, updateProfile, loading: userLoading } = useAuthStore();
  const { 
    subscription, 
    fetchSubscriptionStatus, 
    updateSubscription, 
    loading: subscriptionLoading 
  } = useSubscriptionStore();
  
  useEffect(() => {
    if (!subscription) {
      fetchSubscriptionStatus();
    }
  }, [fetchSubscriptionStatus, subscription]);
  
  // Email Notification Settings
  const subscriptionValidationSchema = Yup.object({
    subscription_type: Yup.string()
      .oneOf(['daily', 'weekly', 'custom', 'none'], 'Invalid subscription type')
      .required('Subscription type is required'),
    custom_interval_hours: Yup.number()
      .when('subscription_type', {
        is: 'custom',
        then: Yup.number()
          .min(1, 'Interval must be at least 1 hour')
          .required('Interval is required'),
        otherwise: Yup.number().notRequired(),
      }),
  });
  
  // Password Change form schema
  const passwordValidationSchema = Yup.object({
    current_password: Yup.string()
      .required('Current password is required'),
    new_password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .required('New password is required'),
    confirm_password: Yup.string()
      .oneOf([Yup.ref('new_password'), null], 'Passwords must match')
      .required('Confirm password is required'),
  });
  
  // User Profile form schema
  const profileValidationSchema = Yup.object({
    first_name: Yup.string().required('First name is required'),
    last_name: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
  });
  
  // Notification Settings form schema
  const notificationValidationSchema = Yup.object({
    push_notifications: Yup.boolean(),
    browser_notifications: Yup.boolean(),
    notification_frequency: Yup.string()
      .oneOf(['realtime', 'hourly', 'daily', 'none'], 'Invalid notification frequency')
      .required('Notification frequency is required'),
  });
  
  // Handle subscription form submission
  const handleSubscriptionSubmit = async (values, { setSubmitting }) => {
    try {
      await updateSubscription({
        subscription_type: values.subscription_type,
        custom_interval_hours: values.subscription_type === 'custom' ? values.custom_interval_hours : undefined,
      });
      toast.success('Email subscription preferences updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update subscription preferences');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle password form submission
  const handlePasswordSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await updateProfile({ password: values.new_password });
      toast.success('Password updated successfully');
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle profile form submission
  const handleProfileSubmit = async (values, { setSubmitting }) => {
    try {
      await updateProfile({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle notification form submission
  const handleNotificationSubmit = async (values, { setSubmitting }) => {
    try {
      // This would call your API to update notification settings
      toast.success('Notification preferences updated successfully');
    } catch (error) {
      toast.error('Failed to update notification preferences');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (userLoading && !user) {
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
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">
      <h1 className="text-3xl font-display font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 text-transparent bg-clip-text mb-8">
        Settings
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1">
          <div className="glass-card p-4">
            <nav className="space-y-1">
              <a href="#profile" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20">
                <FiUser className="mr-3 h-5 w-5" />
                Profile
              </a>
              <a href="#password" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-light-900 dark:text-light-300 hover:bg-light-100 dark:hover:bg-dark-200">
                <FiLock className="mr-3 h-5 w-5" />
                Password
              </a>
              <a href="#email" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-light-900 dark:text-light-300 hover:bg-light-100 dark:hover:bg-dark-200">
                <FiMail className="mr-3 h-5 w-5" />
                Email Digest
              </a>
              <a href="#notifications" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-light-900 dark:text-light-300 hover:bg-light-100 dark:hover:bg-dark-200">
                <FiBell className="mr-3 h-5 w-5" />
                Notifications
              </a>
              <a href="#preferences" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-light-900 dark:text-light-300 hover:bg-light-100 dark:hover:bg-dark-200">
                <FiSliders className="mr-3 h-5 w-5" />
                Preferences
              </a>
            </nav>
          </div>
        </div>
        
        {/* Settings Forms */}
        <div className="md:col-span-3 space-y-8">
          {/* Profile Settings */}
          <div id="profile" className="glass-card p-6">
            <h2 className="text-xl font-display font-medium mb-6 flex items-center">
              <FiUser className="mr-2" /> Profile Information
            </h2>
            
            <Formik
              initialValues={{
                first_name: user?.first_name || '',
                last_name: user?.last_name || '',
                email: user?.email || '',
              }}
              validationSchema={profileValidationSchema}
              onSubmit={handleProfileSubmit}
              enableReinitialize
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="first_name" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                          First Name
                        </label>
                        <Field
                          type="text"
                          name="first_name"
                          id="first_name"
                          className="input"
                        />
                        <ErrorMessage name="first_name" component="div" className="mt-1 text-red-500 text-xs" />
                      </div>
                      
                      <div>
                        <label htmlFor="last_name" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                          Last Name
                        </label>
                        <Field
                          type="text"
                          name="last_name"
                          id="last_name"
                          className="input"
                        />
                        <ErrorMessage name="last_name" component="div" className="mt-1 text-red-500 text-xs" />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                        Email
                      </label>
                      <Field
                        type="email"
                        name="email"
                        id="email"
                        className="input"
                      />
                      <ErrorMessage name="email" component="div" className="mt-1 text-red-500 text-xs" />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting || userLoading}
                      className="primary-button inline-flex items-center"
                    >
                      <FiSave className="mr-2" />
                      {userLoading ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
          
          {/* Password Settings */}
          <div id="password" className="glass-card p-6">
            <h2 className="text-xl font-display font-medium mb-6 flex items-center">
              <FiLock className="mr-2" /> Change Password
            </h2>
            
            <Formik
              initialValues={{
                current_password: '',
                new_password: '',
                confirm_password: '',
              }}
              validationSchema={passwordValidationSchema}
              onSubmit={handlePasswordSubmit}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="current_password" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                        Current Password
                      </label>
                      <Field
                        type="password"
                        name="current_password"
                        id="current_password"
                        className="input"
                      />
                      <ErrorMessage name="current_password" component="div" className="mt-1 text-red-500 text-xs" />
                    </div>
                    
                    <div>
                      <label htmlFor="new_password" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                        New Password
                      </label>
                      <Field
                        type="password"
                        name="new_password"
                        id="new_password"
                        className="input"
                      />
                      <ErrorMessage name="new_password" component="div" className="mt-1 text-red-500 text-xs" />
                    </div>
                    
                    <div>
                      <label htmlFor="confirm_password" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                        Confirm New Password
                      </label>
                      <Field
                        type="password"
                        name="confirm_password"
                        id="confirm_password"
                        className="input"
                      />
                      <ErrorMessage name="confirm_password" component="div" className="mt-1 text-red-500 text-xs" />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting || userLoading}
                      className="primary-button inline-flex items-center"
                    >
                      <FiSave className="mr-2" />
                      {userLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
          
          {/* Email Settings */}
          <div id="email" className="glass-card p-6">
            <h2 className="text-xl font-display font-medium mb-6 flex items-center">
              <FiMail className="mr-2" /> Email Digest Settings
            </h2>
            
            <Formik
              initialValues={{
                subscription_type: subscription?.subscription_type || 'daily',
                custom_interval_hours: subscription?.custom_interval_hours || 24,
              }}
              validationSchema={subscriptionValidationSchema}
              onSubmit={handleSubscriptionSubmit}
              enableReinitialize
            >
              {({ isSubmitting, values }) => (
                <Form>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-light-900 dark:text-light-300 mb-3">
                        Digest Frequency
                      </label>
                      
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Field
                            type="radio"
                            name="subscription_type"
                            id="daily"
                            value="daily"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-light-500 dark:border-dark-100"
                          />
                          <label htmlFor="daily" className="ml-3 block text-sm text-light-900 dark:text-light-300">
                            Daily Digest
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <Field
                            type="radio"
                            name="subscription_type"
                            id="weekly"
                            value="weekly"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-light-500 dark:border-dark-100"
                          />
                          <label htmlFor="weekly" className="ml-3 block text-sm text-light-900 dark:text-light-300">
                            Weekly Digest
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <Field
                            type="radio"
                            name="subscription_type"
                            id="custom"
                            value="custom"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-light-500 dark:border-dark-100"
                          />
                          <label htmlFor="custom" className="ml-3 block text-sm text-light-900 dark:text-light-300">
                            Custom Interval
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <Field
                            type="radio"
                            name="subscription_type"
                            id="none"
                            value="none"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-light-500 dark:border-dark-100"
                          />
                          <label htmlFor="none" className="ml-3 block text-sm text-light-900 dark:text-light-300">
                            Unsubscribe from all emails
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {values.subscription_type === 'custom' && (
                      <div>
                        <label htmlFor="custom_interval_hours" className="block text-sm font-medium text-light-900 dark:text-light-300 mb-1">
                          Custom Interval (hours)
                        </label>
                        <Field
                          type="number"
                          name="custom_interval_hours"
                          id="custom_interval_hours"
                          min="1"
                          className="input max-w-xs"
                        />
                        <ErrorMessage name="custom_interval_hours" component="div" className="mt-1 text-red-500 text-xs" />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting || subscriptionLoading}
                      className="primary-button inline-flex items-center"
                    >
                      <FiSave className="mr-2" />
                      {subscriptionLoading ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
          
          {/* Notification Settings */}
          <div id="notifications" className="glass-card p-6">
            <h2 className="text-xl font-display font-medium mb-6 flex items-center">
              <FiBell className="mr-2" /> Notification Settings
            </h2>
            
            <Formik
              initialValues={{
                push_notifications: false,
                browser_notifications: true,
                notification_frequency: 'daily',
              }}
              validationSchema={notificationValidationSchema}
              onSubmit={handleNotificationSubmit}
            >
              {({ isSubmitting, values }) => (
                <Form>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <label htmlFor="push_notifications" className="block text-sm font-medium text-light-900 dark:text-light-300">
                          Push Notifications
                        </label>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                          <Field
                            type="checkbox"
                            name="push_notifications"
                            id="push_notifications"
                            className="sr-only"
                          />
                          <div className="toggle-bg bg-light-400 dark:bg-dark-200 border-2 border-light-400 dark:border-dark-200 rounded-full w-10 h-6"></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${values.push_notifications ? 'translate-x-4' : ''}`}></div>
                        </div>
                      </div>
                      <p className="text-sm text-light-700 dark:text-light-600 mt-1">
                        Receive push notifications for important updates
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between">
                        <label htmlFor="browser_notifications" className="block text-sm font-medium text-light-900 dark:text-light-300">
                          Browser Notifications
                        </label>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                          <Field
                            type="checkbox"
                            name="browser_notifications"
                            id="browser_notifications"
                            className="sr-only"
                          />
                          <div className="toggle-bg bg-light-400 dark:bg-dark-200 border-2 border-light-400 dark:border-dark-200 rounded-full w-10 h-6"></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${values.browser_notifications ? 'translate-x-4' : ''}`}></div>
                        </div>
                      </div>
                      <p className="text-sm text-light-700 dark:text-light-600 mt-1">
                        Receive notifications in your browser when active
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-light-900 dark:text-light-300 mb-2">
                        Notification Frequency
                      </label>
                      <Field
                        as="select"
                        name="notification_frequency"
                        className="input"
                      >
                        <option value="realtime">Real-time</option>
                        <option value="hourly">Hourly Digest</option>
                        <option value="daily">Daily Digest</option>
                        <option value="none">Disabled</option>
                      </Field>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="primary-button inline-flex items-center"
                    >
                      <FiSave className="mr-2" />
                      {isSubmitting ? 'Saving...' : 'Save Notification Settings'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
          
          {/* Other Preferences */}
          <div id="preferences" className="glass-card p-6">
            <h2 className="text-xl font-display font-medium mb-6 flex items-center">
              <FiSliders className="mr-2" /> App Preferences
            </h2>
            
            {/* Other preference controls could go here */}
            <p className="text-light-800 dark:text-light-500">
              Additional app preferences coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};go